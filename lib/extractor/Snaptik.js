/**
 * @github.com/motebaya - © 2023-10
 * file: snaptik.js
 */
import Init from "../Init.js";
import FormData from "form-data";
import cheerio from "cheerio";

class Snaptik extends Init {
  constructor(verbose) {
    super(verbose);
    this.host = "https://snaptik.app";
  }

  /**
   * snaptik render images to video
   * @params token: <token_render> generated from same page images list
   * @return json
   *
   */
  async render_video(token) {
    this.logger.debug(`Rendering video with token: ${token.slice(0, 20)}...`);
    return new Promise(async (resolve) => {
      if (token !== undefined) {
        let tasks = await this.client.get(`${this.host}/render.php`, {
          params: {
            token: token,
          },
          responseType: "json",
        });
        let data = tasks.data;
        if (data.status === 0 && Object.keys(data).includes("task_url")) {
          tasks = await this.client.get(data.task_url, {
            responseType: "json",
          });
          data = tasks.data;
          if (data.status === 0) {
            data["status"] = true;
            resolve(data);
          } else {
            this.logger.debug("rendering failed in job 2. ");
            resolve({
              status: false,
            });
          }
        } else {
          this.logger.debug("rendering failed, no task url!");
          resolve({
            status: false,
          });
        }
      }
    });
  }

  /**
   * snaptik: Get video data from video url
   * @params string url: tiktok video url
   * @return object json
   *
   */
  async get_video_data(url) {
    this.logger.debug(`Extracting video from url: ${url}`);
    return new Promise(async (resolve) => {
      if (this.isTiktokUrl(url)) {
        let token = await this.get_token(this.host);
        if (token.status) {
          token = token.token;
          const form = new FormData();
          form.append("url", url);
          form.append("token", token);

          const res = await this.client.post(`${this.host}/abc2.php`, form);
          const content = this.get_inner_html(res.data);
          if (content !== undefined) {
            const $ = cheerio.load(content);

            /**
             * snaptik.app also posible to download image slide and render all images to video without watermark.
             * here filter if video type is images or video.
             *
             */
            const images = $("div.photo");
            if (images.length !== 0) {
              this.logger.debug(`${images.length} Images Collected..`);
              let short_info = await this.get_webpage_info(url);
              short_info = short_info.status
                ? { ...short_info, isImage: true }
                : {
                    status: true,
                    isImage: true,
                  };
              short_info.images = images
                .map((i, e) => {
                  return {
                    thumbnail: $(e).find("img").attr("src"),
                    url: $(e).find("a").attr("href"),
                  };
                })
                .get();

              // render video from token
              const token_render = $("button.btn-render").attr("data-token");
              short_info.videos =
                token_render !== undefined
                  ? await this.render_video(token_render)
                  : "-";
              resolve(short_info);
            } else {
              let short_info = await this.get_short_info(url);
              short_info = short_info.status
                ? short_info
                : {
                    status: true,
                    isImage: false,
                  };

              short_info.videos = $("a")
                .map((i, e) => {
                  let url = $(e).attr("href");
                  if (url !== "/")
                    return url.startsWith("/file") ? this.host + url : url;
                })
                .get();

              /**
               * i think download_hd url just gimmick, bcs web
               * showing ads when you press it. and url is same.
               */
              const download_hd = $("button").attr("data-backup");
              if (download_hd !== undefined) {
                short_info.videos.push(download_hd);
              }
              resolve(short_info);
            }
          } else {
            this.logger.debug("failed extracting video, null response!");
            resolve({
              status: false,
              message: "failed get content data",
            });
          }
        } else {
          resolve(token);
        }
      }
    });
  }
}

export default Snaptik;
