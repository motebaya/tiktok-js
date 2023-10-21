/**
 * @github.com/motebaya - © 2023-10
 * file: musicaldown.js
 */
import Init from "../Init.js";
import axios from "axios";
import cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import FormData from "form-data";

class Musicaldown extends Init {
  constructor(verbose) {
    super(verbose);
    this.host = "https://musicaldown.com";
    this.session_client = wrapper(
      axios.create({
        jar: new CookieJar(),
        headers: {
          Host: "musicaldown.com",
          Origin: this.host.slice(0, -1),
          DNT: "1",
          "User-Agent": this.client.defaults.headers["User-Agent"],
          "Content-Type": "application/x-www-form-urlencoded",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          TE: "trailers",
        },
      })
    );
  }

  /**
   * convert image slider to video. idk yah, why owner site used external site just for render image.
   * @params token: data token from response page.
   * @return string
   *
   */
  async render_video(token) {
    this.logger.debug(`Rendering videos with token: ${token.slice(0, 20)}...`);
    return new Promise(async (resolve) => {
      try {
        const form = new FormData();
        form.append("data", token);
        const res = await this.client.post("https://mddown.xyz/slider", form, {
          responseType: "json",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        if (res.data.success) {
          this.logger.debug(`render succes!`);
          resolve(res.data.url);
        } else {
          resolve("#");
        }
      } catch (err) {
        this.logger.error(`something wrong when rendering video, due: ${err}`);
        resolve("#");
      }
    });
  }

  /**
   * same form & same session, get mp3 for video type only.
   * doesn't work when i try it to get mp3 from image type.
   * @return object
   *
   */
  async get_mp3(form) {
    this.logger.debug(`Getting music data for ... `);
    return new Promise(async (resolve) => {
      const page = await this.session_client.post(
        `${this.host}/mp3/download`,
        form
      );
      const $ = cheerio.load(page.data);
      const t = new RegExp(/<b\>music\stitle<\/b>\:([^"]+?)\</i).exec(
        page.data
      );
      const row = $("a[class$='download']");
      if (row !== undefined) {
        resolve({
          url:
            row.attr("href") === undefined
              ? row.nextUntil("a[class='orange']").eq(1).attr("href")
              : row.attr("href"),
          title:
            t !== null
              ? t[1]
              : $("div[class*='row']")
                  .find("h2[class*='white-text']")
                  .contents()
                  .eq(1)
                  .text()
                  .slice(1)
                  .trim(),
        });
      } else {
        resolve();
      }
    });
  }

  async get_video_data(url) {
    this.logger.debug(`extracing video from url: ${url}`);
    return new Promise(async (resolve) => {
      if (this.isTiktokUrl(url)) {
        let page = await this.session_client.get(`${this.host}/en`);
        const form = {};
        let $ = cheerio.load(page.data);
        // that site using random form input name.
        $("form[method='POST']")
          .find("input")
          .each((i, e) => {
            let val = e.attribs.value;
            form[e.attribs.name] = val !== undefined ? val : url;
          });

        // post it.
        page = await this.session_client.post(`${this.host}/download`, form);
        page = page.data;
        $ = cheerio.load(page);
        const img = $("div[class*='card-image']");
        if (img.length !== 0) {
          this.logger.debug(`${img.length} images collected...`);
          let short_info = await this.get_webpage_info(url);
          short_info = short_info.status
            ? { ...short_info, isImage: true }
            : {
                status: true,
                isImage: true,
              };
          short_info.images = img
            .map((i, e) => {
              return {
                thumbnail: $(e).find("img").attr("src"),
                url: $(e).next().find("a").attr("href"),
              };
            })
            .get();

          /**
           * render image slider are not optional, it will render directly.
           * if failed, videos href -> no url (#).
           *
           */
          const token_render = new RegExp(/data\:\s'([^']+?)'/gi).exec(page);
          short_info.videos =
            token_render !== null
              ? await this.render_video(token_render[1])
              : "#";

          // image type does'nt have music details info
          const imgmusic = $('a[class$="download"]').attr("href");
          if (imgmusic !== undefined) {
            short_info.music = {
              url: imgmusic,
              title: "-",
            };
          }
          // return per block.
          resolve(short_info);
        } else {
          let short_info = await this.get_short_info(url);
          short_info = short_info.status
            ? short_info
            : {
                status: true,
                isImage: false,
              };
          short_info.videos = $("div[class='row']")
            .find("a.btn")
            .map((i, e) => $(e))
            .get()
            .reduce((t, s) => {
              const url = s.attr("href");
              if (
                url.startsWith("http") &&
                !s.text().toLowerCase().includes("watermark")
              ) {
                t.push(url);
              }
              return t;
            }, []);
          this.logger.debug(
            `${short_info.videos.length} videos server collected..`
          );
          short_info.author.avatar = $("div[class='img-area']")
            .find("img")
            .attr("src");

          // separated mp3 extractor only for video type.
          const music = await this.get_mp3(form);
          if (music !== undefined) {
            short_info.music = music;
          }
          resolve(short_info);
        }
      }
    });
  }
}

export default Musicaldown;
