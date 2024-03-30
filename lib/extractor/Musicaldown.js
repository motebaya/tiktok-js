/**
 * @github.com/motebaya - © 2023-10
 * file: musicaldown.js
 */
import Init from "../Init.js";
import cheerio from "cheerio";
import FormData from "form-data";
import chalk from "chalk";
import Utils from "../Util.js";

class Musicaldown extends Init {
  /**
   * global
   */
  static host = "https://musicaldown.com";

  /**
   * Init
   *
   * @param {boolean} verbose debug/verbose.
   */
  constructor(verbose) {
    super(verbose);
    this.host = Musicaldown.host;
    this.session_client = this.createSession(this.host);
  }

  /**
   * render images slide show to video
   *
   * @param {string} token token from response page.
   * @returns {Promise<string>}
   */
  async renderVideo(token) {
    return new Promise(async (resolve) => {
      this.logger.debug(
        `${chalk.white(
          `[${chalk.green(this.renderVideo.name)}:${chalk.green(
            Utils.getHostName(this.host)
          )}] Rendering With token::`
        )}${chalk.green(token.slice(0, 20))}...`
      );
      try {
        const form = new FormData();
        form.append("data", token);
        const res = await this.client.post("https://mddown.xyz/slider", form, {
          responseType: "json",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        if (res.data.success) {
          this.logger.debug(
            `${chalk.white(
              `[${chalk.green(this.renderVideo.name)}:${chalk.green(
                Utils.getHostName(this.host)
              )}] Rendering success..`
            )}`
          );
          resolve(res.data.url);
        } else {
          resolve("#");
        }
      } catch (err) {
        this.logger.error(
          `[${chalk.white(
            this.host
          )}] Failed rendering videos, due::${chalk.yellow(err.message)}`
        );
        resolve("#");
      }
    });
  }

  /**
   * get music url with same formdata and session.
   * this method only work when media type is video.
   * i've try it for images, but no result.
   *
   * @param {object} form object form data.
   * @returns {Promise<Object|undefined>}
   *
   */
  async getMusicData(form) {
    return new Promise(async (resolve) => {
      this.logger.debug(
        `${chalk.white(
          `[${chalk.green(this.getMusicData.name)}:${chalk.green(
            Utils.getHostName(this.host)
          )}] Extracting Music data...`
        )}`
      );
      const page = await this.session_client.post(
        `${this.host}/mp3/download`,
        form
      );
      const $ = cheerio.load(page.data);
      const t = new RegExp(/<b\>music\stitle<\/b>\:([^"]+?)\</i).exec(
        page.data
      );
      const row = $("a[class$='download']");
      if (row.length > 0) {
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
        this.logger.error(
          `[${Utils.getHostName(this.host)}] ${chalk.yellow(
            `Error, while extracting music data...`
          )}`
        );
        resolve();
      }
    });
  }

  /**
   * extract video data from url.
   *
   * @param {object} opts
   * @param {string} opts.url tiktok video url.
   * @param {boolean} opts.render optional, render images slide show.
   * @param {boolean} opts.getmusic optional, it will get music data if set to 1 and video type isn't images.
   * @returns {Promise<Object>}
   */
  async getVideoData(opts) {
    const { url, render, getmusic } = opts;
    return new Promise(async (resolve) => {
      const validate = Utils.isTiktokUrl(url);
      if (validate.status) {
        this.logger.debug(
          `${chalk.white(
            `[${chalk.green(this.getVideoData.name)}:${chalk.green(
              Utils.getHostName(this.host)
            )}] Extracting video::${chalk.green(
              (await this.getVideoId(url)).video_id
            )}`
          )}`
        );
        let page = await this.session_client.get(`${this.host}/en`);
        const form = {};
        let $ = cheerio.load(page.data);
        /**
         * site using random form name.
         */
        $("form[method='POST']")
          .find("input")
          .each((i, e) => {
            let val = e.attribs.value;
            form[e.attribs.name] = val !== undefined ? val : url;
          });

        /**
         * first post data only get video data, for music it need post separately.
         * but for images will get both.
         * see: <this.get_mp3>
         */
        page = await this.session_client.post(`${this.host}/download`, form);
        page = page.data;
        $ = cheerio.load(page);

        let result;
        const images = $("div[class*='card-image']");
        if (images.length !== 0) {
          this.logger.debug(
            `${chalk.white(
              `[${chalk.green(this.getVideoData.name)}:${chalk.green(
                Utils.getHostName(this.host)
              )}] ${chalk.green(images.length)} Images Collected...`
            )}`
          );
          result = {
            ...(await this.getWebpageInfo(url)),
            status: true,
            isImage: true,
            images: images
              .map((i, e) => {
                return $(e).find("img").attr("src");
              })
              .get(),
          };
          /**
           * render?
           */
          if (render) {
            const token_render = new RegExp(/data\:\s'([^']+?)'/gi).exec(page);
            result.videos =
              token_render !== null
                ? await this.renderVideo(token_render[1])
                : "#";
          }
          /**
           * webapage info alrdy have music info include url.
           * but sometime not working.
           */
          if (result.music !== undefined) {
            result.music.url =
              $('a[class$="download"]').attr("href") ?? result.music.url;
          }
        } else {
          result = {
            ...(await this.getShortInfo(url)),
            status: true,
            isImage: false,
            videos: $("div[class='row']")
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
              }, []),
          };
          this.logger.debug(
            `${chalk.white(
              `[${chalk.green(this.getVideoData.name)}:${chalk.green(
                Utils.getHostName(this.host)
              )}] ${chalk.green(
                result.videos.length
              )} Videos Server Collected...`
            )}`
          );
          // short info doesn't have avatar.
          result.author.avatar = $("div[class='img-area']")
            .find("img")
            .attr("src");

          /**
           * avoid useless request for get music.
           * e.g: you just want to download video from cli, nah
           * no need send request for music, because unused.
           */
          if (getmusic) {
            const music = await this.getMusicData(form);
            if (music !== undefined) {
              result.music = music;
            }
          }
        }
        resolve(result);
      } else {
        this.logger.error(
          `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
            validate.message
          )}`
        );
        resolve(validate);
      }
    });
  }
}

export default Musicaldown;
