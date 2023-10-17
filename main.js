/**
 * @github.com/motebaya - © 2023-10
 * file: main.js
 * ()
 */
import Aweme from "./lib/extractor/Aweme.js";
import Snaptik from "./lib/extractor/Snaptik.js";
import Tikmate from "./lib/extractor/Tikmate.js";
import { _download } from "./lib/downloader.js";
import chalk from "chalk";
import readlineSync from "readline-sync";
import { parse as parse_url } from "url";
import { format as sprintf } from "util";

// https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
String.prototype.toTitleCase = function () {
  return this.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

// DRY: only for avatar & music cover url
const getFormatExt = (url) => {
  const rawName = new RegExp(/\/([^/]+\.(jpeg|webp))/).exec(url);
  return rawName !== null ? rawName[2] : "jpeg";
};

export const SERVER_LIST = {
  aweme: Aweme,
  snaptik: Snaptik,
  tikmate: Tikmate,
};

/**
 * video extractor and result handler
 * @params string url: tiktok videos url
 * @parmas string server: server
 * @params string mediaType: media type for download
 * @params bool verbose: debug mode on
 * @return undefined
 *
 */
export const _extract = async (url, server, mediaType, verbose) => {
  return new Promise(async (resolve) => {
    /**
     * `all` evaluated in js.
     * @see https://stackoverflow.com/a/23674838
     */
    server = server.toLowerCase();
    if ([url, server, verbose].every((val) => val !== undefined)) {
      if (Object.keys(SERVER_LIST).includes(server)) {
        const instance = new SERVER_LIST[server](verbose);
        /**
         * not all method need video id for extract it, but
         * just make sure tiktok url video is correctly.
         */
        const urlInfo = await instance.get_video_id(url);
        if (urlInfo.status) {
          const target = server === "aweme" ? urlInfo.video_id : urlInfo.url;
          const result = await instance.get_video_data(target);
          // console.log(result);
          // process.exit(0);
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
            ].forEach((e, i) => {
              let val = result[e];
              if (val !== undefined) {
                if (typeof val !== "object") {
                  console.log(
                    ` * ${chalk.blue(e.toTitleCase())}: ${chalk.white(val)}`
                  );
                } else {
                  ["name", "username", "bio", "user_id"].forEach((e, i) => {
                    let aval = val[e];
                    if (aval !== undefined) {
                      if (
                        !Array.isArray(aval) &&
                        !new RegExp(/^https:\/\//).test(aval.trim())
                      ) {
                        console.log(
                          ` * ${chalk.blue(e.toTitleCase())}: ${chalk.white(
                            aval
                          )}`
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
            if (mediaType !== undefined) {
              switch (mediaType) {
                case "music":
                  if (result.music !== undefined) {
                    console.log(` * Music: ${chalk.green(result.music.title)}`);
                    await _download(
                      result.music.url,
                      sprintf("%s-%s-music.mp3", server, urlInfo.video_id),
                      instance.logger
                    );
                  } else {
                    instance.logger.error(
                      `This server doesn't availabe for download ${mediaType} from videos!`
                    );
                  }
                  break;
                case "video":
                  // console.log(result);
                  if (!result.isImage && result.videos !== undefined) {
                    // do download videos list
                    if (Array.isArray(result.videos)) {
                      const videos = Array.from(new Set(result.videos));
                      videos.forEach((val, index) => {
                        console.log(
                          sprintf(
                            " [%s] %s",
                            chalk.blue((index + 1).toString().padStart(2, "0")),
                            chalk.white(parse_url(val).host)
                          )
                        );
                      });
                      console.log(
                        ` ${chalk.white("-".repeat(30))}\n ${chalk.white(
                          "-".repeat(30)
                        )}`
                      );
                      const cserver = readlineSync.question(
                        " * Choose Server (eg:1): ",
                        {
                          limit: (input) => {
                            return (
                              !isNaN(input) && parseInt(input) <= videos.length
                            );
                          },
                          limitMessage: `Input digit and more than '${videos.length}'`,
                        }
                      );
                      console.log();
                      await _download(
                        result.videos[cserver],
                        sprintf("%s-%s-videos.mp4", server, urlInfo.video_id),
                        instance.logger
                      );
                    } else {
                      await _download(
                        result.videos,
                        sprintf("%s-%s-videos.mp4", server, urlInfo.video_id),
                        instance.logger
                      );
                    }
                  }
                  break;
                case "image":
                  if (result.isImage && result.images.length !== 0) {
                    instance.logger.info(
                      `downloading ${result.images.length} Images`
                    );
                    /**
                     * download concurreny.
                     * default format filename: 4308923407324-images-01
                     * default mime are .jpeg
                     */
                    await Promise.all(
                      result.images.map(async (url, index) => {
                        await _download(
                          typeof url === "object" ? url.url : url,
                          sprintf(
                            "%s-images-%s.jpeg",
                            urlInfo.video_id,
                            (index + 1).toString().padStart(2, "0")
                          ),
                          instance.logger
                        );
                      })
                    );
                  } else {
                    // it will be download avatar and thumbnail/cover if url is video
                    instance.logger.info("Collecting avatar images..");
                    const avatar = result.author.avatar;
                    const extendedImages = [];
                    if (avatar !== undefined) {
                      extendedImages.push({
                        f: sprintf(
                          "%s-avatar.%s",
                          result.author.username,
                          getFormatExt(avatar)
                        ),
                        u: avatar,
                      });
                    }

                    // image cover from aweme have 2 format (.jpeg and .webp). just get jpeg format.
                    instance.logger.info("Collecting music cover images..");
                    if (result.music !== undefined) {
                      const musicCover = result.music.cover;
                      extendedImages.push({
                        f: sprintf(
                          "%s-cover-.%s",
                          result.music.title,
                          getFormatExt(musicCover)
                        ),
                        u: musicCover,
                      });
                    }

                    // thumbnail
                    instance.logger.info("Collecting thumbnail videos..");
                    if (result.thumbnail !== undefined) {
                      extendedImages.push({
                        f: `${urlInfo.video_id}-thumbnail.jpeg`,
                        u: result.thumbnail,
                      });
                    }
                    if (extendedImages.length !== 0) {
                      instance.logger.info(
                        `downloading ${extendedImages.length} non content images..`
                      );
                      await Promise.all(
                        extendedImages.map(async (t) => {
                          await _download(t.u, t.f, instance.logger);
                        })
                      );
                    }
                  }
                  break;
              }
            }
            resolve();
          } else {
            instance.logger.error(`media type required for download`);
            process.exit(0);
          }
        } else {
          instance.logger.error(JSON.stringify(urlInfo, null, 2));
          process.exit(0);
        }
      } else {
        instance.logger.error(`invalid suplied server for: ${server}`);
        process.exit(0);
      }
    } else {
      instance.logger.error(`Required suplied args: url, server, verbose!`);
      process.exit(0);
    }
  });
};
