/**
 * @github.com/motebaya - © 2023-10
 * file: aweme.js
 */
import Init from "../Init.js";
import chalk from "chalk";
import Utils from "../Util.js";

class Aweme extends Init {
  /**
   * global
   */
  static host = "https://api-h2.tiktokv.com";

  /**
   * Init
   *
   * @param {boolean} verbose debug/verbose.
   */
  constructor(verbose) {
    super(verbose);
    this.host = Aweme.host;
  }

  /**
   * extract video data from url/videoid
   * idk, how much the limit request of this api :<.
   *
   * @param {object} opts
   * @param {string} opts.videoid titkok video id.
   * @returns {Promise<Object>}
   */
  async getVideoData(opts) {
    let { videoid, url } = opts;
    return new Promise(async (resolve, reject) => {
      videoid =
        videoid === undefined && Utils.isTiktokUrl(url).status
          ? (await this.getVideoId(url)).video_id
          : videoid;
      this.logger.debug(
        `${chalk.white(
          `[${chalk.green(this.getVideoData.name)}:${chalk.green(
            Utils.getHostName(this.host)
          )}] Extracting video data for::${chalk.green(videoid)}`
        )}`
      );
      if (videoid !== undefined && new RegExp(/^[0-9]+$/).test(videoid)) {
        let response = await this.client.get(`${this.host}/aweme/v1/feed/`, {
          params: {
            version_code: "2613",
            aweme_id: videoid,
            device_type: "Pixel%204",
          },
          responseType: "json",
        });
        let data = response.data;
        if (data.status_code === 0) {
          const selected = data.aweme_list[0];
          const author = selected.author;
          const music = selected.music;
          const result = {
            status: true,
            description: selected.desc,
            video_id: selected.aweme_id,
            author: {
              user_id: author.id,
              avatar: author.avatar_medium.url_list[1],
              name: author.nickname,
              bio: author.signature,
              username: author.unique_id,
            },
            music: {
              title: music.title,
              author: music.author,
              cover:
                music.cover_hd.url_list[
                  music.cover_hd.url_list.length === 1 ? 0 : 1
                ],
              url: music.play_url.url_list[0],
            },
            stats: {
              total_share: selected.statistics.share_count,
              total_download: selected.statistics.download_count,
              total_views: selected.statistics.play_count,
              total_comment: selected.statistics.comment_count,
            },
          };

          if (Object.keys(selected).includes("image_post_info")) {
            this.logger.debug(
              `${chalk.white(
                `[${chalk.green(this.getVideoData.name)}:${chalk.green(
                  Utils.getHostName(this.host)
                )}] ${chalk.green(
                  selected.image_post_info.images.length
                )} Images Collected...`
              )}`
            );
            result.isImage = true;
            result.images = selected.image_post_info.images.map((img) => {
              return (
                img.display_image.url_list[1] ?? img.display_image.url_list[0]
              );
            });
          } else {
            let video = selected.video;
            result.isImage = false;
            result.videos = video.play_addr.url_list;
            result.thumbnail = video.cover.url_list[1];
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
            `[${chalk.green(
              Utils.getHostName(this.host)
            )}] Error, extracting video data from::${chalk.yellow(videoid)}`
          );
          resolve({
            status: false,
            message: `failed get video data, id: ${videoid}`,
          });
        }
      } else {
        this.logger.error(
          `[${chalk.green(
            Utils.getHostName(this.host)
          )}] Invalid tiktok video id..`
        );
        resolve({
          status: false,
          message: `invalid suplied video id!, ${videoid}`,
        });
      }
    });
  }
}

export default Aweme;
