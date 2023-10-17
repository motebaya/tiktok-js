/**
 * @github.com/motebaya - © 2023-10
 * file: downloader.js
 *
 */
import axios from "axios";
import progress from "cli-progress";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

// https://stackoverflow.com/a/10420352/
const filesize = (a, b, c, d, e) => {
  return (
    ((b = Math),
    (c = b.log),
    (d = 1e3),
    (e = (c(a) / c(d)) | 0),
    a / b.pow(d, e)).toFixed(e ? 2 : 0) +
    " " +
    (e ? "kMGTPEZY"[--e] + "B" : "Bytes")
  );
};

/**
 * https://github.com/axios/axios#request-config
 * https://github.com/npkgz/cli-progress/tree/master#options-1
 *
 * Asynchronous downloader with progress bar
 * @params string url: stream url target to download
 * @params optional|string filename: optional filename to save downlaoded file
 * @return object json: status
 *
 */
export const _download = async (options) => {
  const { url, filename, logger } = options;
  if (url !== undefined && logger !== undefined) {
    logger.debug("Starting download from suplied url..");
    const prog = new progress.Bar({
      barCompleteChar: "━",
      barInCompleteChar: "-",
      fps: 10,
      stream: process.stdout,
      barsize: 30,
      stopOnComplete: false,
      clearOnComplete: false,
      format:
        "downloading: {bar} {percentage}% | {current}/{totalMax} | ETA: {eta}s",
    });

    // default path to save output downloaded
    const defaultpath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../output"
    );
    if (!fs.existsSync(defaultpath)) {
      fs.mkdirSync(defaultpath);
    }

    // default filename DIR/output/filename.[ext]
    if (filename === undefined) {
      throw new Error(
        `filename included their extension, it's not posible to download when not suplied any filename`
      );
    }

    // safe mode not overwrite existing downloaded file
    const shortFname = `output/${filename}`;
    if (!fs.existsSync(filename)) {
      logger.info(`Stream created to: ${shortFname}`);
      const stream = fs.createWriteStream(filename);
      return new Promise(async (resolve, reject) => {
        await axios({
          url: url,
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 11; Infinix X6810) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Mobile Safari/537.36",
          },
          responseType: "stream",
        }).then((response) => {
          let current = 1;
          let total = parseInt(response.headers["content-length"]);
          prog.start(total, 0);
          prog.update({ totalMax: filesize(total) });
          response.data
            .on("data", (chunk) => {
              current += chunk.length;
              prog.increment(chunk.length);
              prog.update({ current: filesize(current) });
            })
            .pipe(stream);
          response.data.on("error", (err) => {
            prog.stop();
            reject(err);
          });
        });
        stream.on("finish", () => {
          prog.stop();
          logger.info(`Saved: ${shortFname}`);
          resolve();
        });
      });
    } else {
      logger.info(`Aborting, due file: ${shortFname} already downloaded!`);
    }
  } else {
    logger.error("nothing suplied params");
  }
};
