/**
 * @github.com/motebaya - 12.26.2023
 * file: savetik.js
 */

import Init from "../Init.js";
import chalk from "chalk";
import cheerio from "cheerio";
import Utils from "../Util.js";

class Savetik extends Init {
  /**
   * global
   */
  static host = "https://savetik.co";

  /**
   * Init
   * @param {boolean} verbose debug/verbose mode
   */
  constructor(verbose) {
    super(verbose);
    this.host = Savetik.host;
    this.session_client = this.createSession(this.host);
  }

  /**
   * render images slideshow to video.
   *
   * @param {string} page html response data.
   * @returns {Promise<string>}
   */
  async renderVideo(opts) {
    const { page, $ } = opts;
    return new Promise(async (resolve) => {
      const etoken = new RegExp(
        /k_exp\s*=\s*['"]([\d+]+)["'][\s\S*]*?k_token\s*=\s*['"]([^"']+)["']/
      ).exec(page);
      if (etoken !== null) {
        this.logger.debug(
          `${chalk.white(
            `[${chalk.green(this.renderVideo.name)}:${chalk.green(
              Utils.getHostName(this.host)
            )}] Rendering With Token::`
          )}${chalk.green(etoken[2].slice(0, 20))}...`
        );
        const el = $('a[id="ConvertToVideo"]');
        const params = {
          audioType: "audio/mp3",
          ftype: "mp4",
          fquality: "1080p",
          fname: "Savetik.co",
          exp: etoken[1],
          token: etoken[2],
          audioUrl: el.attr("data-audiourl"),
          imageUrl: el.attr("data-imagedata"),
          v_id: $('input[id="TikTokId"]').attr("value"),
        };

        /**
         * found out endpoint for check task: `/checkTask`, but cloudflare blocked request.
         * i think just need call again, till convert success...
         */
        let converted;
        do {
          this.logger.debug(
            `${chalk.white(
              `[${chalk.green(this.renderVideo.name)}:${chalk.green(
                Utils.getHostName(this.host)
              )}]`
            )} converting....`
          );
          converted = await this.client.post(
            "https://d.tik-cdn.com/api/json/convert",
            new URLSearchParams(params),
            {
              timeout: 10000,
              responseType: "json",
              headers: {
                Host: "d.tik-cdn.com",
                "Content-Type":
                  "application/x-www-form-urlencoded; charset=UTF-8",
                Origin: this.host,
                Referer: `${this.host}/`,
              },
            }
          );
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } while (new RegExp(/converting/i).test(converted.data.result));

        if (
          converted.data.status.toLowerCase() === "success" &&
          converted.status === 200
        ) {
          this.logger.debug(
            `${chalk.white(
              `[${chalk.green(this.renderVideo.name)}:${chalk.green(
                Utils.getHostName(this.host)
              )}]`
            )} Rendering Success..!`
          );
          resolve(converted.data.result);
        } else {
          this.logger.error(
            `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
              `Render failed::\n${chalk.white(
                JSON.stringify(converted.data, null, 2)
              )}`
            )}`
          );
          resolve("#");
        }
      } else {
        this.logger.error(
          `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
            "couldn't find token from page"
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
   * @param {string} opts.url tiktok video url
   * @param {boolean} opts.render optional render images to video.
   * @returns {Promise<Object>}
   */
  async getVideoData(opts) {
    const { url, render } = opts;
    return new Promise(async (resolve) => {
      this.logger.debug(
        `${chalk.white(
          `[${chalk.green(this.getVideoData.name)}:${chalk.green(
            Utils.getHostName(this.host)
          )}] Extracting video::${chalk.green(
            (await this.getVideoId(url)).video_id
          )}`
        )}`
      );
      const validate = Utils.isTiktokUrl(url);
      if (validate.status) {
        let page = await this.session_client.get(`${this.host}/en`);
        page = await this.session_client.post(
          `${this.host}/api/ajaxSearch`,
          new URLSearchParams({
            lang: "en",
            q: url,
          }),
          {
            headers: {
              Host: new URL(this.host).hostname,
              "Content-Type":
                "application/x-www-form-urlencoded; charset=UTF-8",
              Origin: this.host,
              Referer: "https://savetik.co/en",
            },
          }
        );
        page = page.data;
        if (page.status.toLowerCase() === "ok") {
          page = page.data;
          let result;
          const $ = cheerio.load(page);
          const images = $(
            'div[class="photo-list"] > ul[class="download-box"]'
          ).find("li");
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
             * render if media choosed == videos
             */
            if (render) {
              result.videos = await this.renderVideo({ page, $ });
            }

            /**
             * same as ssstik & musicaldown,
             * because music url from webpage sometime not working.
             */
            result.music.url =
              $('a[id="ConvertToVideo"]').attr("data-audiourl") ??
              result.music.url;

            // this full music content (not the music which have same duration as video).
            // result.music.url =
            //   $('div[class="dl-action"]')
            //     .find("a:has(i.icon-download)")
            //     .attr("href") ?? result.music.url;
          } else {
            const rsc = $('div[class="dl-action"]').find("a").toArray();
            if (rsc.length !== 0) {
              result = {
                ...(await this.getShortInfo(url)),
                status: true,
                isImage: false,
                ...rsc.reduce(
                  (d, e) => {
                    const url = $(e).attr("href");
                    if (!new RegExp(/mp3/gi).test($(e).text())) {
                      d.videos.push(url);
                    } else {
                      d.music.url = url;
                    }
                    return d;
                  },
                  { videos: [], music: { title: "-" } }
                ),
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
            }
          }
          resolve(result);
        } else {
          this.logger.error(
            `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
              `Failed fetch data::\n${chalk.white(
                JSON.stringify(page, null, 2)
              )}`
            )}`
          );
          resolve(...page, { status: false });
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

export default Savetik;
