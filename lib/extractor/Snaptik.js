/**
 * @github.com/motebaya - © 2023-10
 * file: snaptik.js
 */
import Init from "../Init.js";
import FormData from "form-data";
import cheerio from "cheerio";
import chalk from "chalk";
import Utils from "../Util.js";

class Snaptik extends Init {
  /**
   * global
   */
  static host = "https://snaptik.app";

  /**
   * Init
   *
   * @param {boolean} verbose debug/verbose.
   */
  constructor(verbose) {
    super(verbose);
    this.host = Snaptik.host;
  }

  /**
   * render images slide show to video.
   *
   * @param {string} token token from response page.
   * @returns {Promise<string>}
   */
  async renderVideo(token) {
    return new Promise(async (resolve) => {
      this.logger.debug(
        `${chalk.white(
          `[${chalk.green(this.renderVideo.name)}:${Utils.getHostName(
            this.host
          )}] Rendering With Token::${chalk.green(token.slice(0, 20))}...`
        )}`
      );
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
          if (data.status === 0 && data.hasOwnProperty("download_url")) {
            this.logger.info(
              `[${chalk.white(this.renderVideo.name)}] ${chalk.white(
                "Rendering success..."
              )}`
            );
            resolve(data.download_url);
          } else {
            this.logger.error(
              `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
                "Couldn't Rendering in task #2, unknow status response"
              )}`
            );
            resolve("#");
          }
        } else {
          this.logger.error(
            `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
              "Couldn't Render, no task response..."
            )}`
          );
          resolve("#");
        }
      } else {
        this.logger.error(
          `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
            "No token to render..."
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
   * @param {string} opts.url tikok video url
   * @param {boolean} opts.render optional, when media type is images. render to video/not.
   * @returns {Promise<Object>}
   */
  async getVideoData(opts) {
    const { url, render } = opts;
    return new Promise(async (resolve) => {
      const validate = Utils.isTiktokUrl(url);
      if (validate.status) {
        this.logger.debug(
          `${chalk.white(
            `[${chalk.green(this.getVideoData.name)}:${chalk.green(
              Utils.getHostName(this.host)
            )}] Extracting video data::${chalk.green(
              (await this.getVideoId(url)).video_id
            )}`
          )}`
        );
        const token = await this.getToken({ host: this.host });
        if (token.status) {
          const form = new FormData();
          form.append("url", this.to_video_url(url));
          form.append("token", token.token);

          const page = await this.client.post(`${this.host}/abc2.php`, form);
          const innerHtml = this.getInnerHtml(page.data);
          if (innerHtml.status) {
            const $ = cheerio.load(innerHtml.result);
            /**
             * empty photo element == video type.
             */
            let result;
            const images = $("div.photo");
            if (images.length !== 0) {
              this.logger.debug(
                `${chalk.white(
                  `[${chalk.green(this.getVideoData.name)}:${chalk.green(
                    Utils.getHostName(this.host)
                  )}] ${chalk.green(images.length)} Images Collected...`
                )}`
              );

              /**
               * same as tikmate, there is no music from site.
               * i think both site is same dev.
               */
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
               * render? if posible.
               */
              if (render) {
                result.videos = await this.renderVideo(
                  $("button.btn-render").attr("data-token")
                );
              }
            } else {
              result = {
                ...(await this.getWebpageInfo(url)),
                status: true,
                isImage: false,
                videos: $("a")
                  .map((i, e) => {
                    let url = $(e).attr("href");
                    if (url !== "/")
                      return url.startsWith("/file") ? this.host + url : url;
                  })
                  .get(),
              };

              /**
               * the button say `HD`, but i think just alternate url.
               */
              let alternateUrl = $("button").attr("data-backup");
              if (alternateUrl !== undefined) {
                result.videos.push(alternateUrl);
              }

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
            resolve(result);
          } else {
            this.logger.error(
              `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
                innerHtml.message
              )}`
            );
            resolve(innerHtml);
          }
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

export default Snaptik;
