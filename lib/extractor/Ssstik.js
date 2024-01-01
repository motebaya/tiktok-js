/**
 * @github.com/motebaya - 2023.12.09
 * Sstik.js
 */

import Init from "../Init.js";
import chalk from "chalk";
import cheerio from "cheerio";
import Utils from "../Util.js";

class Ssstik extends Init {
  /**
   * global
   */
  static host = "https://ssstik.io";

  /**
   * Init
   *
   * @param {boolean} verbose debug/verbose
   */
  constructor(verbose) {
    super(verbose);
    this.host = Ssstik.host;
    this.session_client = this.createSession(this.host);
  }

  /**
   * render images slideshow to video
   *
   * @param {string} token slides_data token from images html response.
   * @returns {Promise<string>}
   */
  async renderVideo(token) {
    return new Promise(async (resolve) => {
      this.logger.debug(
        `${chalk.white(
          `[${chalk.green(this.renderVideo.name)}:${chalk.green(
            Utils.getHostName(this.host)
          )}] Rendering With Token::`
        )}${chalk.green(token.slice(0, 20))}...`
      );
      if (token !== undefined) {
        const page = await this.client.post(
          "https://r.ssstik.top/index.sh",
          {
            slides_data: token,
          },
          {
            headers: {
              Host: "r.ssstik.top",
              "Content-Length": `slides_data=${encodeURIComponent(token)}`
                .length,
              "Sec-Ch-Ua":
                '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
              Dnt: 1,
              "Hx-Target": "slides_generate",
              "Hx-Current-Url": `${this.host}/en#google_vignette`,
              "Sec-Ch-Ua-Mobile": "?0",
              "Content-Type":
                "application/x-www-form-urlencoded; charset=UTF-8",
              "Hx-Trigger": "slides_generate",
              "Hx-Request": true,
              "Sec-Ch-Ua-Platform": '"Windows"',
              Accept: "*/*",
              Origin: this.host,
              "Sec-Fetch-Site": "cross-site",
              "Sec-Fetch-Mode": "cors",
              "Sec-Fetch-Dest": "empty",
              Referer: `${this.host}/`,
              "Accept-Encoding": "gzip, deflate, br",
              "Accept-Language": "en-US,en;q=0.9,id-ID;q=0.8,id;q=0.7",
            },
          }
        );
        /**
         * strict download url format.
         * in the future, format download url might be changed by server.
         */
        if (
          new RegExp(/^(http[s]\:\/\/r[0-9]*\.ssstik\.top\/ssstik\/\d+$)/).test(
            page.headers["hx-redirect"]
          )
        ) {
          this.logger.debug(
            `${chalk.white(
              `[${chalk.green(this.renderVideo.name)}:${chalk.green(
                Utils.getHostName(this.host)
              )}]`
            )} Rendering Success..!`
          );
          resolve(page.headers["hx-redirect"]);
        } else {
          this.logger.error(
            `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
              `unknow format download url::${pae.headers["hx-redirect"]}`
            )}`
          );
          resolve("#");
        }
      } else {
        this.logger.error(
          `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
            "No Token render suplied"
          )}`
        );
        resolve("#");
      }
    });
  }

  /**
   * extract video data from url.
   *
   * @param {object} opts options
   * @param {string} opts.url tiktok video url.
   * @param {boolean} opts.render optional, render video.
   * @returns {Promise<Object>}
   */
  async getVideoData(opts) {
    const { url, render } = opts;
    return new Promise(async (resolve) => {
      this.logger.debug(
        `${chalk.white(
          `[${chalk.green(this.getVideoData.name)}:${chalk.green(
            Utils.getHostName(this.host)
          )}] Extracting data::${chalk.green(
            (await this.getVideoId(url)).video_id
          )}`
        )}`
      );
      const validate = Utils.isTiktokUrl(url);
      if (validate.status) {
        let page = await this.session_client.get(`${this.host}/en`);
        const token = await this.getToken({
          host: this.host,
          page: page.data,
        });
        if (token.status) {
          page = await this.session_client.post(`${this.host}/abc?url=dl`, {
            id: url,
            locale: "en",
            tt: token.token,
          });
          const $ = cheerio.load(page.data);
          /**
           * empty images element == videos type.
           */
          let result;
          const images = $('li[class="splide__slide"]');
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
                  return $(e).find("a").attr("href");
                })
                .get(),
            };
            /**
             * render?
             */
            if (render) {
              result.videos = await this.renderVideo(
                $('input[name="slides_data"]').attr("value")
              );
            }

            /**
             * same as musicaldown,
             * because music from webpage sometime not working.
             */
            result.music.url =
              $('a[class*="music"]').attr("href") ?? result.music.url;
          } else {
            /**
             * it'same as snaptik, the button say `HD` without watermark.
             * but i think that's just alternate download url.
             *
             */
            let info = await this.getWebpageInfo(url);
            if (info.status) {
              info.music.url = $('a[class*="music"]').attr("href");
            } else {
              info = await this.getShortInfo(url);
            }
            result = {
              ...info,
              status: true,
              isImage: false,
              videos: $('a[class*="without_watermark"]').attr("href") ?? "#",
            };
            this.logger.debug(
              `${chalk.white(
                `[${chalk.green(this.getVideoData.name)}:${chalk.green(
                  Utils.getHostName(this.host)
                )}] Video Url Collected...`
              )}`
            );
          }
          resolve(result);
        } else {
          this.logger.error(
            `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
              token.message
            )}`
          );
          resolve(token);
        }
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

export default Ssstik;
