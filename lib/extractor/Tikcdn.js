/**
 * @github.com/motebaya - 12.22.2023
 * file: Tikcdn.js
 */

import Init from "../Init.js";
import chalk from "chalk";
import FormData from "form-data";
import Utils from "../Util.js";

class Tikcdn extends Init {
  /**
   * global
   */
  static host = "https://tikcdn.app";

  /**
   * init
   * @param {boolean} verbose debug/verbose mode
   */
  constructor(verbose) {
    super(verbose);
    this.host = Tikcdn.host;
    this.session_client = this.createSession(this.host);
  }

  /**
   * extract video data from url
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
          )}] Extracting data::${chalk.green(
            (await this.getVideoId(url)).video_id
          )}`
        )}`
      );
      const validate = Utils.isTiktokUrl(url);
      if (validate.status) {
        let page = await this.session_client.get(`${this.host}/`);
        const token = await this.getToken({
          host: this.host,
          page: page.data,
        });
        if (token.status) {
          const form = new FormData();
          form.append("_token", token.token);
          form.append("actions", "post");
          form.append("lang", "");
          form.append("url", url);
          page = await this.session_client.post(`${this.host}/insta`, form);
          page = page.data;
          if (typeof page.success === "object") {
            page = page.success;
            const result = {
              status: true,
              video_id: page.id,
              title: page.title,
              author: {
                name: page.author.nickname,
                username: page.author.unique_id,
                avatar: page.author.avatar,
              },
              music: {
                title: page.music_info.title,
                url: page.music_info.play,
                author: page.music_info.author,
                cover: page.music_info.cover,
              },
              stats: {
                total_views: page.play_count,
                total_comment: page.comment_count,
                total_share: page.share_count,
                total_download: page.download_count,
              },
            };
            const images = page.images;
            if (images !== undefined) {
              this.logger.debug(
                `${chalk.white(
                  `[${chalk.green(this.getVideoData.name)}:${chalk.green(
                    Utils.getHostName(this.host)
                  )}] ${chalk.green(images.length)} Images Collected...`
                )}`
              );
              result.isImage = true;
              result.images = images;
            } else {
              /**
               * tikcdn also return with watermark video, but i think no need.
               */
              const videos = [page.hdplay, page.play];
              this.logger.debug(
                `${chalk.white(
                  `[${chalk.green(this.getVideoData.name)}:${chalk.green(
                    Utils.getHostName(this.host)
                  )}] ${chalk.green(videos.length)} Videos Server Collected...`
                )}`
              );
              result.isImage = false;
              result.videos = videos;
              result.thumbnail = page.origin_cover;
            }
            resolve(result);
          } else {
            // page.success !== object = string
            this.logger.error(
              `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
                page.success
              )}`
            );
            resolve({
              status: false,
              message: page.success,
            });
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

export default Tikcdn;
