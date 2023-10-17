/**
 * @github.com/motebaya - © 2023-10
 * file: api.js
 */
import ejs from "ejs";
import express from "express";
import axios from "axios";
import { format as sprintf } from "util";
import { SERVER_LIST } from "../main.js";
import { encryptStr, decryptStr } from "../lib/Util.js";
const routerAPI = express.Router({
  caseSensitive: true,
  strict: true,
});

routerAPI.route("/").get((req, res) => {
  res.status(200).render("api", { title: "Api's Documentation" });
});

/**
 * DRY !!
 */
const renderHTML = async (ObjectData) => {
  return new Promise(async (resolve) => {
    let data = {
      title: "Tiktok dl - Error Processing Video",
      result: ObjectData,
    };
    data = ObjectData.status
      ? {
          title: `Tiktok dl - ${ObjectData.author.username} - videos`,
          encryptStr: encryptStr,
          result: ObjectData,
        }
      : data;
    resolve(await ejs.renderFile("views/content.ejs", data));
  });
};

/**
 * Route post -> video process handler
 * @params server: server method to process video url
 * @params video_url: tiktok video url
 * @params render [optional]: default=true.
 *
 * all failed response e.g: invalid url or cannot process videos returned as 200 code.
 *
 */
const progPostvideo = async (req, res) => {
  const { server, video_url, render } =
    req.method === "GET" ? req.query : req.body;
  if (video_url !== undefined) {
    if (Object.keys(SERVER_LIST).includes(server)) {
      const serverInstance = new SERVER_LIST[server]();
      const urlInfo = await serverInstance.get_video_id(video_url);
      if (urlInfo.status) {
        const target = server === "aweme" ? urlInfo.video_id : urlInfo.url;
        const data = await serverInstance.get_video_data(target);
        if (data.status) {
          data.server = server;
          if (render !== undefined && render === "false") {
            res.status(200).json({
              status: true,
              result: data,
              message: "success",
            });
          } else {
            res.status(200).json({
              status: true,
              result: encodeURIComponent(await renderHTML(data)),
            });
          }
        } else {
          res.status(200).json({
            status: false,
            result: encodeURIComponent(await renderHTML(data)),
            message: data.message,
          });
        }
      } else {
        res.status(200).json({
          status: false,
          result: encodeURIComponent(await renderHTML(urlInfo)),
          message: `invalid suplied video url for: ${video_url}`,
        });
      }
    } else {
      res.status(500).json({
        status: false,
        message: `server not match: ${Object.keys(SERVER_LIST)}`,
      });
    }
  } else {
    res.status(500).json({
      status: false,
      message: "required video_url for download",
    });
  }
};

/**
 * api route process video
 * method: [GET, POST]
 */
routerAPI.route("/postVideo").post(progPostvideo).get(progPostvideo);

/**
 * Force download browser, actually for helped internal tiktok url.
 * for external url such as snaptik or tikmate have own force download.
 *
 * @params data: secure encrypted url target to download
 * @params dl: filename to download, this optional and will be generated default as
 * [host]-[date]-[time]-.[ext] -> localhost-20-10-2023-01-02-03.jpeg
 *
 */
routerAPI.route("/download").get((req, res) => {
  let { data, dl } = req.query;
  if (dl === undefined) {
    dl = sprintf(
      "%s-%s",
      req.hostname,
      new Date().toLocaleString().replace(/\/|,|\s/g, "-")
    );
  }

  if (data !== undefined) {
    const url = decryptStr(decodeURIComponent(data));
    if (data !== undefined) {
      axios
        .get(url, { responseType: "stream" })
        .then((stream) => {
          const mimetype = stream.headers["content-type"].split("/")[1];
          res.setHeader("Content-Type", "application/octet-stream");
          res.setHeader("Content-Transfer-Encoding", "Binary");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${encodeURIComponent(dl)}.${mimetype}"`
          );
          stream.data.pipe(res);
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      res.status(500).send("Cannot process data, due invalid malformed data!");
    }
  } else {
    res.status(500).json({
      status: false,
      message:
        "external url and filename required for download. see: @github.com/motebaya",
    });
  }
});

export default routerAPI;
