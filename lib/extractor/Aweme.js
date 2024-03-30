/**
 * @github.com/motebaya - © 2023-10
 * file: aweme.js
 */
import Init from "../Init.js";
import chalk from "chalk";
import Utils from "../Util.js";
import asyncRetry from "async-retry";

class Aweme extends Init {
  /**
   * global
   */
  static host = "https://api22-normal-c-useast2a.tiktokv.com";

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
   * build params
   *
   * @param {Object} param
   * @returns {Object}
   */
  getParams(param) {
    return {
      ...param,
      version_name: "1.1.9",
      version_code: "2018111632",
      build_number: "1.1.9",
      manifest_version_code: "2018111632",
      update_version_code: "2018111632",
      openudid: this.getRands("0123456789abcdef", 16),
      uuid: this.getRands("1234567890", 16),
      _rticket: Date.now() * 1000,
      ts: Date.now(),
      device_brand: "Google",
      device_type: "Pixel 4",
      device_platform: "android",
      resolution: "1080*1920",
      dpi: 420,
      os_version: "10",
      os_api: "29",
      carrier_region: "US",
      sys_region: "US",
      region: "US",
      app_name: "trill",
      app_language: "en",
      language: "en",
      timezone_name: "America/New_York",
      timezone_offset: "-14400",
      channel: "googleplay",
      ac: "wifi",
      mcc_mnc: "310260",
      is_my_cn: 0,
      aid: 1180,
      ssmix: "a",
      as: "a1qwert123",
      cp: "cbfhckdckkde1",
    };
  }

  /**
   * extract video data from url/videoid
   * idk, how much the limit request of this api.
   * Api credit from: https://raw.githubusercontent.com/wahdalo/tiktok-src/main/lib/ttapi.js
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
        const data = await asyncRetry(
          async () => {
            let res = await this.client.get(`${this.host}/aweme/v1/feed/`, {
              params: new URLSearchParams(
                this.getParams({
                  aweme_id: videoid,
                })
              ),
              headers: {
                "User-Agent":
                  "com.ss.android.ugc.trill/494+Mozilla/5.0+(Linux;+Android+12;+2112123G+Build/SKQ1.211006.001;+wv)+AppleWebKit/537.36+(KHTML,+like+Gecko)+Version/4.0+Chrome/107.0.5304.105+Mobile+Safari/537.36",
              },
              responseType: "json",
            });
            if (res.headers["content-length"] !== "0") {
              return res.data;
            }
            throw new Error("no data");
          },
          {
            forever: true,
            minTimeout: 0,
            maxTimeout: 0,
          }
        );
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
                music.cover_medium.url_list[
                  music.cover_medium.url_list.length === 1 ? 0 : 1
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
