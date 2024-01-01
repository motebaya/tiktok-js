/**
 * @github.com/motebaya - 12.23.2023
 * file: Tikwm.js
 */

import Init from "../Init.js";
import chalk from "chalk";
import Utils from "../Util.js";

class Tikwm extends Init {
  /**
   * global
   */
  static host = "https://www.tikwm.com";

  /**
   * Init
   *
   * @param {boolean} verbose debug/verbose mode
   */
  constructor(verbose) {
    super(verbose);
    this.host = Tikwm.host;
  }

  /**
   * extract video data from url.
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
        let page = await this.client.post(
          `${this.host}/api/`,
          new URLSearchParams({ url }),
          {
            headers: {
              Host: new URL(this.host).hostname,
              "Content-Type":
                "application/x-www-form-urlencoded; charset=UTF-8",
              Origin: this.host,
            },
            responseType: "json",
          }
        );
        page = page.data;
        if (page.msg.toLowerCase() === "success") {
          page = page.data;
          const result = {
            status: true,
            video_id: page.id,
            title: page.title,
            music: {
              author: page.music_info.author,
              url: page.music_info.play,
              title: page.music_info.title,
            },
            stats: {
              total_comment: page.comment_count,
              total_share: page.share_count,
              total_views: page.play_count,
              total_download: page.download_count,
            },
            author: {
              username: page.author.unique_id,
              avatar: page.author.avatar,
              name: page.author.nickname,
            },
          };
          if (page.images !== undefined) {
            this.logger.debug(
              `${chalk.white(
                `[${chalk.green(this.getVideoData.name)}:${chalk.green(
                  Utils.getHostName(this.host)
                )}] ${chalk.green(page.images.length)} Images Collected...`
              )}`
            );
            result.images = page.images;
            result.isImage = true;
          } else {
            this.logger.debug(
              `${chalk.white(
                `[${chalk.green(this.getVideoData.name)}:${chalk.green(
                  Utils.getHostName(this.host)
                )}] Video url collected...`
              )}`
            );
            result.isImage = false;
            result.videos = page.play;
            result.thumbnail = page.origin_cover;
          }
          resolve(result);
        } else {
          this.logger.error(
            `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
              `Error, while fetching ${Utils.getHostName(this.host)} Api's`
            )}`
          );
          resolve({
            status: false,
            ...page,
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

  /**
   * get video list from user feed.
   * dunno how much the limit request ¯\_(ツ)_/¯.
   * but the website say to buy paid API if need a lot of request.
   *
   * @param {object} opts options
   * @returns {Promise<Object>}
   */
  async getUserFeed(opts) {
    const { username, cursor } = opts;
    return new Promise(async (resolve) => {
      const validate = Utils.isTiktokUsername(username);
      if (validate.status) {
        let page = await this.client.post(
          `${this.host}/api/user/posts`,
          new URLSearchParams({
            count: 12,
            cursor: cursor ?? 0,
            hd: 1,
            unique_id: username,
            web: 1,
          }),
          {
            headers: {
              Host: new URL(this.host).hostname,
              "Content-Type":
                "application/x-www-form-urlencoded; charset=UTF-8",
              Origin: this.host,
            },
            responseType: "json",
          }
        );
        page = page.data;
        if (page.msg.toLowerCase() === "success") {
          this.logger.debug(
            `${chalk.white(
              `[${chalk.green(this.getVideoData.name)}:${chalk.green(
                Utils.getHostName(this.host)
              )}] ${chalk.green(
                page.data.videos.length
              )} Videos Collected from::${username}...`
            )}`
          );
          resolve({
            status: true,
            isFeed: true,
            cursor: page.data.cursor,
            hasMore: page.data.hasMore,
            videos: page.data.videos.map((e, i) => {
              return {
                video_id: e.id,
                title: e.title,
                thumbnail: `${this.host}${e.cover}`,
                url: `${this.host}${e.play}`,
                music: {
                  author: e.music_info.author,
                  url: e.music_info.play,
                  title: e.music_info.title,
                },
                stats: {
                  total_comment: e.comment_count,
                  total_share: e.share_count,
                  total_views: e.play_count,
                  total_download: e.download_count,
                },
                author: {
                  username: e.author.unique_id,
                  avatar: `${this.host}${e.author.avatar}`,
                  name: e.author.nickname,
                },
              };
            }),
          });
        } else {
          this.logger.error(
            `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
              `Error, while fetching ${Utils.getHostName(this.host)} Api's`
            )}`
          );
          resolve({
            status: false,
            ...page,
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

export default Tikwm;
