/**
 * @github.com/motebaya - 2023.12.2
 * file: tiktokdownloadr.js
 */

import Init from "../Init.js";
import chalk from "chalk";
import cheerio from "cheerio";
import Utils from "../Util.js";

/**
 * only support for video.
 */
class Tiktokdownloadr extends Init {
  /**
   * global
   */
  static host = "https://www.tiktokdownloadr.com";

  /**
   * Init
   *
   * @param {boolean} verbose verbose/debug.
   */
  constructor(verbose) {
    super(verbose);
    this.host = Tiktokdownloadr.host;
    this.session_client = this.createSession(this.host);
  }

  /**
   * Extract video data from url.
   *
   * @param {object} opts options
   * @param {string} opts.url tiktok video url
   * @returns {Promise<Object>}
   */
  async getVideoData(opts) {
    const { url } = opts;
    return new Promise(async (resolve) => {
      const validate = Utils.isTiktokUrl(url);
      if (validate.status) {
        this.logger.debug(
          `${chalk.white(
            `[${chalk.green(this.getVideoData.name)}:${chalk.green(
              Utils.getHostName(this.host)
            )}] Extracting data::${chalk.green(
              (await this.getVideoId(url)).video_id
            )}`
          )}`
        );
        /**
         * this server stuck on request when media type is image.
         * so, need make sure the media type from url isn't image.
         * it return status -> false if url type is image.
         *
         * also this server sometime return empty response.
         * (maybe down or still maintanance)
         *
         */
        let result = await this.getShortInfo(url);
        if (result.status) {
          let page = await this.session_client.get(`${this.host}/`);
          const form = {};
          const $ = cheerio.load(page.data);
          $('form[method="POST"]')
            .find("input")
            .each((i, e) => {
              let val = e.attribs.value;
              form[e.attribs.name] = val !== undefined ? val : url;
            });

          page = await this.session_client.post(`${this.host}/fetch-api`, form);
          page = page.data;
          if (Object.keys(page).length !== 0) {
            const videos = page.downloadUrls.map((e) => {
              return e.url;
            });
            this.logger.debug(
              `${chalk.white(
                `[${chalk.green(this.getVideoData.name)}:${chalk.green(
                  Utils.getHostName(this.host)
                )}] ${chalk.green(videos.length)} Videos Server Collected...`
              )}`
            );
            /**
             * this server doesn't have music and author info,
             * but music download url always working,
             */
            const webpageResult = await this.getWebpageInfo(url);
            if (webpageResult.status) {
              result = webpageResult;
              result.music.url = page.mp3URL;
            }
            resolve({
              status: true,
              isImage: false,
              ...result,
              videos: videos,
            });
          } else {
            this.server.error(
              `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
                "Server Return as Empty Response, Try again Later.."
              )}`
            );
            resolve({
              status: false,
              message: "no response from server",
            });
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
        this.server.error(
          `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
            validate.message
          )}`
        );
        resolve(validate);
      }
    });
  }
}

export default Tiktokdownloadr;
