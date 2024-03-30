/**
 * @github.com/motebaya - © 2023-10
 * file: downloader.js
 */
import axios from "axios";
import progress from "cli-progress";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert";
import chalk from "chalk";
import Utils from "./Util.js";

class Downloader {
  /**
   * c: https://stackoverflow.com/a/20732091
   *
   * @param {number} size bytes length.
   * @returns {string}
   */
  static humanSize(size) {
    var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
    return (
      (size / Math.pow(1024, i)).toFixed(2) * 1 +
      " " +
      ["B", "kB", "MB", "GB", "TB"][i]
    );
  }

  /**
   * Asynchronous downloader with progress bar.
   * - https://github.com/axios/axios#request-config
   * - https://github.com/npkgz/cli-progress/tree/master#options-1
   *
   * @param {object} opts
   * @param {string} opts.url string url to download.
   * @param {string} opts.filename string filename to save.
   * @param {winston.logger} opts.logger downloader class doesn't extend instance which have logger.
   * @param {AxiosInstance} opts.client optional session client instance.
   * @returns {Promise<undefined>}
   */
  static async _download(opts) {
    /**
     * filename included their extension.
     * it wont't be download when not suplied any filename.
     */
    let { url, filename, logger, client } = opts;
    assert(filename !== undefined, chalk.red(`No filename suplied..!`));
    return new Promise(async (resolve, reject) => {
      if (url !== undefined && logger !== undefined) {
        logger.debug(
          `[${chalk.white(this._download.name)}] ${chalk.white(
            Utils.shortToken(url)
          )}`
        );
        const prog = new progress.Bar({
          barCompleteChar: "━",
          barInCompleteChar: "-",
          fps: 10,
          stream: process.stdout,
          barsize: 30,
          stopOnComplete: false,
          clearOnComplete: false,
          format:
            "Downloading: {bar} {percentage}% | {current}/{totalMax} | ETA: {eta}s",
        });

        // default folder output for save: <current>/tiktok-downloader-output
        const defaultpath = path.join(
          path.dirname(fileURLToPath(import.meta.url)),
          "../tiktok-downloader-output"
        );
        if (!fs.existsSync(defaultpath)) {
          fs.mkdirSync(defaultpath);
        }

        // safe mode, not overwriting existing downloaded file.
        filename = `${defaultpath}/${filename}`;
        const shortFname = `./${path.basename(defaultpath)}/${path.basename(
          filename
        )}`;
        if (!fs.existsSync(filename)) {
          const stream = fs.createWriteStream(filename);
          logger.debug(
            `[${chalk.white(
              this._download.name
            )}] Stream Created::${chalk.white(shortFname)}`
          );

          /**
           * The response from snaptik image slide show download URL is really weird!.
           * sometime it returned 404 response. and if let it a few minutes (1-2min)
           * or add something in query params url,
           * it returned 200, and the content could be downloaded as well.
           * i think that's a bug.
           *
           */
          let response;
          do {
            try {
              response =
                client !== undefined
                  ? await client.get(url, {
                      responseType: "stream",
                      maxContentLength: Infinity,
                    })
                  : await axios.get(url, {
                      headers: {
                        "User-Agent":
                          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                      },
                      responseType: "stream",
                    });
            } catch (err) {
              if (err.response) {
                /**
                 * sometime 403/ no access from tiktok webpage music download url.
                 * access denied === no content to downlaod.
                 * cause return html content.
                 */
                if (err.response.status === 403) {
                  const dunnoMime = err.response.headers["content-type"];
                  if (new RegExp(/(html|text)/gi).test(dunnoMime)) {
                    logger.error(
                      `[${chalk.white(
                        this._download.name
                      )}] Error, couldn't download non stream content. (${chalk.white(
                        dunnoMime
                      )}) detected!`
                    );
                    break;
                  }
                } else {
                  logger.error(
                    `[${chalk.white(this._download.name)}] Error: ${
                      err.response.status
                    }`
                  );
                  break;
                }
              } else {
                break;
              }
            }
          } while (response === undefined || response.status !== 200);
          if (response) {
            let current = 1;
            if (
              new RegExp(/(html|text)/gi).test(response.headers["content-type"])
            ) {
              logger.error(
                `[${chalk.white(
                  this._download.name
                )}] Error, couldn't download non stream content.`
              );
              /**
               * stream was created, but content couldn't be downloaded.
               * so, delete it.
               */
              if (fs.existsSync(filename)) {
                fs.rmSync(filename);
              }
              resolve();
            }
            const total = parseInt(response.headers["content-length"]);
            prog.start(total, 0);
            prog.update({ totalMax: this.humanSize(total) });
            response.data
              .on("data", (chunk) => {
                current += chunk.length;
                prog.increment(chunk.length);
                prog.update({ current: this.humanSize(current) });
              })
              .pipe(stream);
            response.data.on("error", (err) => {
              prog.stop();
              reject(err);
            });
            stream.on("finish", () => {
              prog.stop();
              logger.info(`[${chalk.white(this._download.name)}] Success...`);
              resolve();
            });
          } else {
            logger.error(
              `[${chalk.white(this._download.name)}] ${chalk.yellow(
                "No response!, try open url to browser! it might hit a 404 response.. "
              )}`
            );
            resolve();
          }
        } else {
          logger.warn(
            `[${chalk.white(this._download.name)}] SKipp, file::${chalk.green(
              shortFname
            )} exist!`
          );
          resolve();
        }
      } else {
        logger.error(
          `[${chalk.white(this._download.name)}] ${chalk.yellow(
            "Invalid Suplied params!"
          )}`
        );
        resolve();
      }
    });
  }
}

export default Downloader;
