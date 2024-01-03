/**
 * @github.com/motebaya - © 2023-10
 * file: main.js
 * ()
 */
import Downloader from "./lib/downloader.js";
import chalk from "chalk";
import Parameter from "parameter";
import assert from "node:assert";
import Users from "./lib/Users.js";
import fs from "node:fs";
import Utils from "./lib/Util.js";
import { createInterface } from "node:readline";
import { extractor } from "./lib/extractor/index.js";

/**
 * for CLI.
 */
export const serverList = Object.keys(extractor);

/**
 * static class i think more easier to maintainer.
 *
 * @class main
 */

export class _Main {
  /**
   * strict validate params from CLI.
   */
  static parameter = new Parameter({ validateRoot: true });

  /**
   * bulk grab user videos list and save as json file.
   *
   * @param {object} opts
   * @param {string} opts.username tiktok username.
   * @param {number} opts.limit limit to grab.
   * @param {boolean} opts.verbose debug/verbose mode.
   * @returns {undefined}
   *
   */
  static async dumpVideos(opts) {
    const invalidParams = this.parameter.validate(
      {
        username: {
          type: "string",
          required: true,
          message: {
            required: "required username to grab videos lists",
          },
        },
        limit: {
          type: "int",
          required: true,
          min: 35,
          max: 1000,
          message: {
            required: "rquired limit to grab videos lists!",
            min: "limt must be more than 35",
            max: "limit must be less than 1000",
          },
        },
        verbose: {
          type: "boolean",
          required: false,
          default: false,
        },
      },
      opts
    );
    assert(
      invalidParams === undefined,
      chalk.red(JSON.stringify(invalidParams, null, 2))
    );
    const { username, limit, verbose } = opts;
    const users = new Users(verbose);
    const result = await users.getUserVideos({ username, limit });
    if (result.videos.length !== 0) {
      users.logger.info(
        `${chalk.white(
          `[${chalk.green(this.dumpVideos.name)}] Saving ${chalk.green(
            result.videos.length
          )} Items To File...`
        )}`
      );
      const fname = `${username}_${result.videos.length}-videolists.json`;
      fs.writeFileSync(`./${fname}`, JSON.stringify(result, null, 2));
      users.logger.info(
        `${chalk.white(
          `[${chalk.green(this.dumpVideos.name)}] Saved As::${chalk.green(
            fname
          )}.`
        )}`
      );
      return;
    } else {
      users.logger.error(
        `[${chalk.white(
          this.dumpVideos.name
        )}] No result from user::${chalk.yellow(username)}`
      );
      return;
    }
  }

  /**
   * search user by query.
   *
   * @param {object} opts
   * @param {string} opts.query query to search.
   * @param {number} opts.limit total limit users to search.
   * @param {boolean} opts.verbose debug/verbose mode.
   * @returns {undefined}
   *
   */
  static async searchUsers(opts) {
    const invalidParams = this.parameter.validate(
      {
        query: {
          type: "string",
          required: true,
          message: {
            required: "required query to search",
          },
        },
        limit: {
          type: "int",
          min: 10,
          max: 100,
          required: true,
          message: {
            required: "required limit to search.",
            max: "limit search must be less than 100",
            min: "limt sreach must be more than 10/page",
          },
        },
        verbose: {
          type: "boolean",
          required: false,
          default: false,
        },
      },
      opts
    );
    assert(
      invalidParams === undefined,
      chalk.red(JSON.stringify(invalidParams, null, 2))
    );
    const { query, limit, verbose } = opts;
    const users = new Users(verbose);
    const result = await users.searchUser({ query, limit });
    if (result.length !== 0) {
      users.logger.info(
        `${chalk.white(
          `[${chalk.green(this.searchUsers.name)}] Saving ${chalk.green(
            result.length
          )} Items To File...`
        )}`
      );
      const fname = `${query}_${result.length}-search.json`;
      fs.writeFileSync(`./${fname}`, JSON.stringify(result, null, 2));
      users.logger.info(
        `${chalk.white(
          `[${chalk.green(this.searchUsers.name)}] Saved As::${chalk.green(
            fname
          )}`
        )}`
      );
      return;
    } else {
      users.logger.error(
        `[${chalk.white(
          this.dumpVideos.name
        )}] No result from query::${chalk.yellow(query)}`
      );
      return;
    }
  }

  /**
   * CLI extractor handler.
   *
   * @param {object} opts
   * @param {string} opts.url tiktok video url
   * @param {string} opts.server server method.
   * @param {string} opts.mediaType media type to downloads.
   * @param {bool} opts.verbose verbose/debug mode.
   */
  static async _extract(opts) {
    const invalidParams = this.parameter.validate(
      {
        url: {
          required: true,
          type: "string",
          message: {
            required: "required url to execute",
          },
        },
        server: {
          required: true,
          type: "string",
          message: {
            required: "required server to extract video",
          },
        },
        type: {
          required: true,
          type: "string",
          message: {
            required: "required media type to download",
          },
        },
        verbose: {
          required: false,
          default: false,
          type: "boolean",
        },
      },
      opts
    );
    assert(
      invalidParams === undefined,
      `${chalk.red(JSON.stringify(invalidParams, null, 2))}`
    );
    /**
     * not all method need video id for extract it, but
     * just make sure tiktok url video is correctly.
     *
     * optional (render videos from images) only passed for
     * tikmate, and ssstik when media type == images but choosed
     * in CLI video..
     */
    const startExecute = new Date();
    const { url, server, type, verbose } = opts;
    const instance = new extractor[server](verbose);
    const tiktokurl = await instance.getVideoId(url);
    if (tiktokurl.status) {
      const result = await instance.getVideoData({
        url: tiktokurl.video_url,
        videoid: tiktokurl.video_id,
        render:
          ["ssstik", "musicaldown", "savetik"].includes(server) &&
          type === "video",
        getmusic: type === "music" && server === "musicaldown",
      });
      if (result.status) {
        console.log(
          ` ${chalk.white("-".repeat(30))}\n ${chalk.white("-".repeat(30))}`
        );
        [
          "author",
          "title",
          "created",
          "total_views",
          "total_comment",
          "description",
          "stats",
        ].forEach((e, i) => {
          let val = result[e];
          if (val !== undefined) {
            if (typeof val !== "object") {
              console.log(
                ` * ${chalk.blue(Utils.toTitleCase(e))}: ${chalk.white(val)}`
              );
            } else {
              [
                "name",
                "username",
                "bio",
                "user_id",
                "total_share",
                "total_download",
                "total_views",
                "total_comment",
              ].forEach((e, i) => {
                let aval = val[e];
                if (aval !== undefined) {
                  if (
                    !Array.isArray(aval) &&
                    !new RegExp(/^https:\/\//).test(aval.toString().trim())
                  ) {
                    console.log(
                      ` * ${chalk.blue(
                        Utils.toTitleCase(e.replace(/_/g, " "))
                      )}: ${chalk.white(aval)}`
                    );
                  }
                }
              });
            }
          }
        });
        console.log(
          ` ${chalk.white("-".repeat(30))}\n ${chalk.white("-".repeat(30))}`
        );
        if (type !== undefined) {
          switch (type) {
            case "music":
              if (result.music !== undefined) {
                console.log(` * Music: ${chalk.green(result.music.title)}`);
                await Downloader._download({
                  url: result.music.url,
                  filename: `${server}-${tiktokurl.video_id}-music.mp3`,
                  logger: instance.logger,
                  client:
                    server === "ttdownloader"
                      ? instance.session_client
                      : undefined, // ttdownloader need it
                });
              } else {
                instance.logger.error(
                  `[${chalk.white(
                    this._extract.name
                  )}] This server Couldn't download ${chalk.green(
                    type
                  )} from videos!`
                );
              }
              break;
            case "video":
              /**
               * here filter download url.
               *
               */
              if (!result.isImage) {
                if (result.videos !== undefined) {
                  if (Array.isArray(result.videos)) {
                    const videos = Array.from(new Set(result.videos));
                    videos.forEach((val, index) => {
                      console.log(
                        ` [${chalk.blue(
                          (index + 1).toString().padStart(2, "0")
                        )}] ${chalk.white(new URL(val).hostname)}`
                      );
                    });
                    console.log(
                      ` ${chalk.white("-".repeat(30))}\n ${chalk.white(
                        "-".repeat(30)
                      )}`
                    );
                    const rl = createInterface({
                      input: process.stdin,
                      output: process.stdout,
                    });
                    let cserver;
                    for (;;) {
                      cserver = await new Promise((resolve) => {
                        rl.question(
                          ` [${chalk.blue("*")}] Choose Server (eg:1): `,
                          resolve
                        );
                      });
                      if (
                        !isNaN(cserver) &&
                        parseInt(cserver) <= videos.length
                      ) {
                        cserver = parseInt(cserver);
                        break;
                      } else {
                        instance.logger.error(
                          `[${chalk.white(this._extract.name)}] ${chalk.yellow(
                            ` Should be less than equal (${videos.length}) `
                          )}`
                        );
                      }
                    }
                    rl.close();
                    console.log();
                    await Downloader._download({
                      url: result.videos[cserver],
                      filename: `${server}-${tiktokurl.video_id}-videos.mp4`,
                      logger: instance.logger,
                    });
                  } else {
                    // video type but just single download url.
                    if (typeof result.videos === "string") {
                      await Downloader._download({
                        url: result.videos,
                        filename: `${server}-${tiktokurl.video_id}-videos.mp4`,
                        logger: instance.logger,
                        client:
                          server === "ttdownloader"
                            ? instance.session_client
                            : undefined, // ttdownloader need it
                      });
                    }
                  }
                }
              } else {
                /**
                 * rendered images videos, when media type is images.
                 * but choosed type is video.
                 * tikmate, ssstik, musicaldown.
                 *
                 * exclude snaptik, even could render images to videos, but the response often
                 * return 404/not found. dunno why, it's fixed if waiting a few minutes
                 * or add something in query params url (browser). it's bug?
                 */
                if (result.isImage) {
                  if (
                    typeof result.videos === "string" &&
                    result.videos !== "#" &&
                    server !== "snaptik"
                  ) {
                    instance.logger.info(
                      `[${chalk.white(this._extract.name)}] ${chalk.white(
                        "Found Video from images slider.."
                      )}`
                    );
                    await Downloader._download({
                      url: result.videos,
                      filename: `${server}-${tiktokurl.video_id}-videos.mp4`,
                      logger: instance.logger,
                    });
                  } else {
                    instance.logger.warn(
                      `[${chalk.white(
                        this._extract.name
                      )}] There's no video to download...`
                    );
                    process.exit(0);
                  }
                }
              }
              break;
            case "image":
              if (result.isImage && result.images.length !== 0) {
                instance.logger.info(
                  `[${chalk.white(this._extract.name)}] Downloading ${
                    result.images.length
                  } Images From::${chalk.white(tiktokurl.video_id)}`
                );
                /**
                 * download all images in concurrency with default filename.
                 * <videoid>-<images>-{count}.{mime}
                 * e.g: 7301938264783457749-images-01.jpeg
                 */
                await Promise.all(
                  result.images.map(async (url, index) => {
                    await Downloader._download({
                      url: url.url !== undefined ? url.url : url,
                      filename: `${tiktokurl.video_id}-images-${(index + 1)
                        .toString()
                        .padStart(2, "0")}.jpeg`,
                      logger: instance.logger,
                    });
                  })
                );
              }

              /**
               * images type => download all content images, include avatar, cover, and thumbnail.
               * TODO: if type choosed == videos, so there's no images slider to download and will be
               * download other images type.
               * TODO: if type choosed == images -> (read first point!).
               */
              instance.logger.info(
                `${chalk.white(
                  `[${chalk.green(this._extract.name)}] ${chalk.white(
                    "Collecting Avatar Images..."
                  )}`
                )}`
              );
              const avatar = result.author.avatar;
              const extendedImages = [];
              if (avatar !== undefined) {
                extendedImages.push({
                  f: `${result.author.username}-avatar.jpeg`,
                  u: avatar,
                });
              }

              /**
               * not all server have cover title/url for all media type.
               * but aweme have both.
               */
              instance.logger.info(
                `${chalk.white(
                  `[${chalk.green(this._extract.name)}] ${chalk.white(
                    "Collecting Music Images Covers..."
                  )}`
                )}`
              );
              if (result.music !== undefined) {
                const musicCover = result.music.cover;
                if (musicCover !== undefined) {
                  extendedImages.push({
                    f: `${
                      result.music.title !== "-"
                        ? result.music.title
                        : tiktokurl.video_id
                    }-music-cover.jpeg`,
                    u: musicCover,
                  });
                }
              }

              /**
               * thumbnail/ video cover.
               */
              instance.logger.info(
                `${chalk.white(
                  `[${chalk.green(
                    this._extract.name
                  )}] Collecting Thumbnail Videos...`
                )}`
              );
              if (result.thumbnail !== undefined) {
                extendedImages.push({
                  f: `${tiktokurl.video_id}-thumbnail.jpeg`,
                  u: result.thumbnail,
                });
              }
              /**
               * download others all images content in concrurency.
               */
              if (extendedImages.length !== 0) {
                instance.logger.info(
                  `${chalk.white(
                    `[${chalk.green(
                      this._extract.name
                    )}] Downloading::${chalk.yellow(
                      extendedImages.length
                    )} Others Images Contents...`
                  )}`
                );
                await Promise.all(
                  extendedImages.map(async (t) => {
                    await Downloader._download({
                      url: t.u,
                      filename: t.f,
                      logger: instance.logger,
                    });
                  })
                );
              }
              break;
          }
        }
      } else {
        instance.logger.error(
          `[${chalk.white(this._extract.name)}] ${chalk.yellow(result.message)}`
        );
        process.exit(0);
      }
    } else {
      instance.logger.error(
        `[${chalk.white(this._extract.name)}] ${chalk.yellow(
          tiktokurl.message
        )}`
      );
      process.exit(0);
    }
    instance.logger.info(
      `[${chalk.white(this._extract.name)}] Extract Completed in::${chalk.white(
        (new Date() - startExecute) / 1000
      )} Seconds..`
    );
    process.exit(0);
  }
}
