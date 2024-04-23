/**
 * @github.com/motebaya - © 2023-10
 * file: api.js
 */
import express from "express";
import axios from "axios";
import Utils from "../lib/Util.js";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { serverList } from "../main.js";
import { readFileSync, readdirSync } from "node:fs";
import { extractor } from "../lib/extractor/index.js";
import { query, param, validationResult, body, oneOf } from "express-validator";
import path from "node:path";
import url from "node:url";
import { rateLimiter } from "./ratelimiter.js";

const base = url.fileURLToPath(new URL(".", import.meta.url));

const routerAPI = express.Router({
  caseSensitive: true,
  strict: true,
});

/**
 * middleware
 * :limiter
 */
routerAPI.use(rateLimiter);

/**
 * router video post handler
 *
 * default response = json
 * optional, set as rendered html page with ejs.
 */
const routerHandler = async (req, res) => {
  const { server } = req.params;
  const { url, type = "json", username, cursor } = Utils.getFields(req);
  const result = validationResult(req);
  if (result.isEmpty()) {
    const instance = new extractor[server](true);
    /**
     * user feed for tikwm.
     * username: tiktok username
     * cursor: next page if exist.
     */
    if (server === "tikwm" && username !== undefined) {
      const userfeed = await instance.getUserFeed({ username, cursor });
      if (userfeed.status) {
        /**
         * encrypt all streamable url
         */
        for (var i = 0; i < userfeed.videos.length; i++) {
          userfeed.videos[i].urlRedirect = Utils.encryptStr(
            userfeed.videos[i].url
          );
          userfeed.videos[i].music.urlRedirect = Utils.encryptStr(
            userfeed.videos[i].music.url
          );
          userfeed.videos[i].thumbnailRedirect = Utils.encryptStr(
            userfeed.videos[i].thumbnail
          );
        }
        res.status(200).json({
          ...userfeed,
          status: "success",
        });
      } else {
        res.status(500).json({
          ...userfeed,
          status: "failed",
          data:
            type === "html"
              ? encodeURIComponent(
                  await Utils.renderEjs({
                    title: "Tiktok-downloader - Error",
                    result: {
                      message: "failed fetch user feed",
                      errors: JSON.stringify(userfeed),
                    },
                  })
                )
              : {},
        });
      }
    } else {
      const resdata = await instance.getVideoData({
        url: url,
        render: true,
        getmusic: true,
      });
      if (resdata.status) {
        res.status(200).json({
          ...resdata,
          status: "success",
          data:
            type === "html"
              ? encodeURIComponent(
                  await Utils.renderEjs({
                    result: resdata,
                    encryptStr: Utils.encryptStr,
                    isStreamable: (u) => {
                      /**
                       * not sure, cause in the future host server may be changed.
                       * this all list streamable url, which doesn't have mime type to
                       * used as extension file.
                       */
                      return new RegExp(
                        /https?:\/\/(?:d\.rapidcdn\.app|tikcdn\.io|snaptik\.app|cdn\.snaptik\.app|d\.tik-cdn\.com|musdown\.xyz|v[\d]+\.musicaldown\.com|r[\d]+\.ssstik\.top|r[\d]+\.snapxcdn\.com)\//
                      ).test(u);
                    },
                  })
                )
              : {},
        });
      } else {
        // extract failed
        res.status(500).json({
          ...resdata,
          status: "failed",
          data:
            type === "html"
              ? encodeURIComponent(
                  await Utils.renderEjs({
                    title: "Tiktok-downloader - Error",
                    result: {
                      message: "failed extracting video data",
                      errors: JSON.stringify(resdata),
                    },
                  })
                )
              : {},
        });
      }
    }
  } else {
    res.status(500).json({
      status: "failed",
      errors: result.array(),
      data:
        type === "html"
          ? encodeURIComponent(
              await Utils.renderEjs({
                title: "Tiktok-downloader - Error",
                result: {
                  message: "invalid suplied fields",
                  errors: JSON.stringify(result.array()),
                },
              })
            )
          : {},
    });
  }
};

/**
 * strict validate with middleware express-validator.
 * just DRY :<.
 *
 * - param {string} loc source request location
 */
const validated = (loc) => {
  return [
    param("server")
      .trim()
      .notEmpty()
      .withMessage("server required!")
      .isIn(serverList)
      .withMessage(`wrong server, instead ${serverList.join(", ")}`)
      .isLowercase()
      .withMessage("case sensitive is enable")
      .isString(),
    oneOf([loc("url").notEmpty(), loc("username").notEmpty()], {
      message: "no fields",
    }),
    loc("url")
      .custom((value, { req }) => {
        let sc = Utils.getFields(req);
        if (!sc.username && !sc.cursor) {
          if (
            new RegExp(
              /(?:https\:\/\/www\.tiktok\.com\/@[^\"]*?\/video\/([0-9]*)|http[s]\:\/\/vt\.tiktok\.com\/([\w+]*))/
            ).test(value)
          ) {
            return true;
          } else {
            throw new Error("invalid tiktok video url!");
          }
        } else {
          throw new Error("invalid fields suplied!");
        }
      })
      .optional(),
    loc("type")
      .custom((value, { req }) => {
        if (Utils.getFields(req).url) {
          if (["html", "json"].includes(value)) {
            return true;
          } else {
            throw new Error("wrong response result type, choose as json/html.");
          }
        } else {
          throw new Error("invalid fields, `type` must be filled with url");
        }
      })
      .optional(),
    loc("username")
      .custom((value, { req }) => {
        let sc = Utils.getFields(req);
        if (!sc.url && !sc.type) {
          if (req.params.server === "tikwm") {
            if (new RegExp(/^(?:@)?([a-zA-Z0-9_\.]{2,24})$/).test(value)) {
              return true;
            } else {
              throw new Error("invalid suplied tikok username");
            }
          } else {
            throw new Error(
              "get videos from userfeed only available in server 'tikwm'"
            );
          }
        } else {
          throw new Error("invalid fields suplied");
        }
      })
      .optional(),
    loc("cursor")
      .custom((value, { req }) => {
        if (Utils.getFields(req).username) {
          // example cursor -> "1670075413000"
          if (new RegExp(/^[0-9]+$/gi).test(value)) {
            return true;
          } else {
            throw new Error(`malformed cursor -> ${value}, instead ^[0-9]`);
          }
        } else {
          throw new Error(
            "cursor is used to fetch next page data on the user feeds"
          );
        }
      })
      .optional(),
  ];
};
routerAPI
  .route("/v1/:server")
  .get(validated(query), routerHandler)
  .post(validated(body), routerHandler);

/***
 * force download content to browser
 *
 * - param {string} token encrypted url data.
 * - query {string} fname optional filename to download.
 */
routerAPI
  .route("/fdownload")
  .get(
    query("token").trim().notEmpty().withMessage("no data url").isBase64(),
    query("fname").optional(),
    (req, res) => {
      const { token, fname } = req.query;
      const result = validationResult(req);
      if (result.isEmpty()) {
        const dataUrl = Utils.decryptStr(decodeURIComponent(token));
        if (dataUrl !== undefined) {
          axios
            .get(dataUrl, { responseType: "stream" })
            .then((stream) => {
              const mimetype = stream.headers["content-type"].split("/")[1];
              res.setHeader("Content-Type", "application/octet-stream");
              res.setHeader("Content-Transfer-Encoding", "Binary");
              res.setHeader(
                "Content-Disposition",
                `attachment; filename="${
                  fname ??
                  `${req.hostname}-${new Date()
                    .toLocaleString()
                    .replace(/\//gi, "-")
                    .replace(/, /, "-")
                    .replace(/\s/gi, "")}`
                }.${mimetype}"`
              );
              stream.data.pipe(res);
            })
            .catch((err) => {
              /**
               * tiktok music url -> 403 (access denied).
               * others response -> error message
               */
              if (err.response && err.response.status === 403) {
                let msg;
                err.response.data.on("data", (chunk) => {
                  msg += chunk;
                });
                err.response.data.on("end", () => {
                  res.setHeader("Content-Type", "text/html");
                  res.status(403).send(msg);
                });
              } else {
                res.setHeader("Content-Type", "text/html");
                res.status(403).send(err.message);
              }
            });
        } else {
          res.status(500).json({
            status: "failed",
            message: "malformed data token params.",
          });
        }
      } else {
        res.status(500).json({
          status: "failed",
          errors: result.array(),
        });
      }
    }
  );

/**
 * swagger UI, openapi config.
 */
const definition = JSON.parse(
  readFileSync(path.join(process.cwd(), "routes/docs.json"), "utf-8")
);
const options = {
  definition,
  apis: [path.join(process.cwd(), "routes/api.js")],
};
routerAPI.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerJSDoc(options), {
    customSiteTitle: "TiktokJS - api documentation",
    customfavIcon: "/images/logo.ico",
    customCssUrl: ["/css/custom.min.css", "/css/swagger-ui.css"],
    customJs: [
      "/js/swagger-ui-bundle.js",
      "/js/swagger-ui-standalone-preset.js",
    ],
  })
);

/**
 * 404
 */
routerAPI.use("*", (req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

export default routerAPI;
