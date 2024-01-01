/**
 * @github.com/motebaya - 12.26.2023
 * file: SnaptikPro.js
 *
 */

import Init from "../Init.js";
import chalk from "chalk";
import FormData from "form-data";
import cheerio from "cheerio";
import Utils from "../Util.js";

/**
 * this server only support video only,
 * same as: ttdownlaoder, tiktokdownloadr.
 */
class SnaptikPro extends Init {
  /**
   * global
   */
  static host = "https://snaptik.pro";

  /**
   * Init
   *
   * @param {boolean} verbose debug/verbose
   */
  constructor(verbose) {
    super(verbose);
    this.host = SnaptikPro.host;
    this.session_client = this.createSession(this.host);
  }

  /**
   * Get video data from url
   *
   * @param {object} opts options
   * @param {string} opts.url tiktok video url
   * @returns {Promise<Object>}
   */
  async getVideoData(opts) {
    const { url } = opts;
    return new Promise(async (resolve) => {
      this.logger.debug(
        `${chalk.white(
          `[${chalk.green(this.getVideoData.name)}:${chalk.green(
            Utils.getHostName(this.host)
          )}} Extracting data::${chalk.green(
            (await this.getVideoId(url)).video_id
          )}`
        )}`
      );
      const validate = Utils.isTiktokUrl(url);
      if (validate) {
        let result = await this.getShortInfo(url);
        if (result.status) {
          let page = await this.session_client.get(`${this.host}/`);
          const token = await this.getToken({
            host: this.host,
            page: page.data,
          });
          if (token.status) {
            const form = new FormData();
            form.append("submit", "1");
            form.append("token", token.token);
            form.append("url", url);
            page = await this.session_client.post(`${this.host}/action`, form, {
              responseType: "json",
            });
            page = page.data;
            if (!page.error && page.html.length !== 0) {
              const $ = cheerio.load(page.html);
              const video = $('div[class*="btn-container"] > a').attr("href");
              if (video !== undefined) {
                this.logger.debug(
                  `${chalk.white(
                    `[${chalk.green(this.getVideoData.name)}:${chalk.green(
                      Utils.getHostName(this.host)
                    )}] Video Url Collected...`
                  )}`
                );
                resolve({
                  ...(await this.getWebpageInfo(url)),
                  status: true,
                  isImage: false,
                  videos: video,
                });
              } else {
                this.logger.error(
                  `[${chalk.white(
                    Utils.getHostName(this.host)
                  )}] ${chalk.yellow(
                    `Couldn't find video download url from ! --> ${page.html}`
                  )}`
                );
                resolve(page);
              }
            } else {
              this.logger.error(
                `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
                  "Couldn't find download url!"
                )}`
              );
              resolve(page);
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
              "This server only support for video type...!"
            )}`
          );
          resolve({
            ...result,
            message: `server '${this.constructor.name}' does not support for images type.`,
          });
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

export default SnaptikPro;
