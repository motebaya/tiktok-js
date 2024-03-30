/**
 * @github.com/motebaya - © 2023-10
 * file: init.js
 */
import axios from "axios";
import logger from "./logger/logging.js";
import * as AxiosLogger from "axios-logger";
import puppeteer from "puppeteer";
import assert from "node:assert";
import chalk from "chalk";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import Utils from "./Util.js";

/**
 * assertion error throw promise rejection inside async func.
 * globally handle rejection:
 * - https://nodejs.org/api/process.html#event-unhandledrejection
 *
 */
process.on("unhandledRejection", (reason, promise) => {
  console.error(reason);
});

process.on("uncaughtException", (error) => {
  console.error(error);
});

/**
 * AxiosLogger: https://github.com/hg-pyun/axios-logger#enable-config-list
 */
class Init {
  /**
   * init ,client instance and etc.
   */
  constructor(verbose = false) {
    this.verbose = verbose;
    this.logger = logger({ level: this.verbose ? "debug" : "info" });
    this.client = axios.create({
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      },
    });

    if (this.verbose) {
      AxiosLogger.setGlobalConfig({
        prefixText: false,
        status: true,
        params: true,
        headers: false, // not necessary needed for debugging.
        data: false,
        logger: this.logger.debug.bind(this.logger),
      });

      this.client.interceptors.request.use(
        AxiosLogger.requestLogger,
        AxiosLogger.errorLogger
      );
      this.client.interceptors.response.use(
        AxiosLogger.responseLogger,
        AxiosLogger.errorLogger
      );
    }
  }

  /**
   * DRY: strict, create session client with cookiejar.
   * used: <musicaldown>, <tiktokdownloadr>.
   *
   * @param {string} host host session.
   * @returns {AxiosInstance}
   */
  createSession(host) {
    assert(host !== undefined, chalk.red("no host suplied!"));
    return wrapper(
      axios.create({
        jar: new CookieJar(),
        headers: {
          Host: Utils.getHostName(host),
          Origin: host,
          DNT: "1",
          "User-Agent": this.client.defaults.headers["User-Agent"],
          "Content-Type": "application/x-www-form-urlencoded",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7;application/json",
        },
      })
    );
  }

  /**
   * DRY
   *
   * @param {String} url
   * @returns {String}
   */
  to_video_url(url) {
    return url.replace(/\/photo\//, "/video/");
  }

  /**
   * DRY: smallest potrait.
   * save time with blocked to much small image request and videos.
   * exclude: captcha image puzzle and blob (non url).
   *
   * @param {object} custom options
   * @return {Promise<Object>}.
   */
  async getBrowser(opts) {
    if (opts !== undefined) {
      assert(
        opts.constructor === Object,
        chalk.red(`invalid suplied options: ${opts}`)
      );
    } else {
      opts = {};
    }
    return new Promise(async (resolve) => {
      const browser = await puppeteer.launch({
        headless: opts.headless ?? false,
        ignoreHTTPSErrors: opts.ignoreHTTPSErrors ?? true,
        args: [
          "--window-size=414,1024",
          "--fast-start",
          "--disable-extensions",
          "--no-sandbox",
        ],
      });
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        if (request.url().startsWith("http")) {
          if (
            request.resourceType() === "image" &&
            !request.url().includes("captcha")
          ) {
            this.logger.debug(`Image Blocked:: ${chalk.yellow(request.url())}`);
            request.abort();
          } else if (
            request.resourceType() === "media" &&
            request.headers()["content-type"] === "video/mp4"
          ) {
            this.logger.debug(`Video Blocked:: ${chalk.yellow(request.url())}`);
            request.abort();
          } else {
            request.continue();
          }
        }
      });
      await page.setViewport({
        width: 414,
        height: 1024,
        deviceScaleFactor: 0,
        isMobile: true,
        hasTouch: false,
        isLandscape: false,
      });
      resolve({ browser, page });
    });
  }

  /**
   * alternate get video short data from webpage, cause oembed api's doesn't support for images.
   * FIX: `SIGI_STATE` data doesn't exist anymore.
   * and because music are availabe in webpage, so..
   * no need get music media from server (except aweme) if media type is images.
   *
   * ISSUE: music url from webpage sometime return as 403 response (acces denied),
   * that's mean it couldn't be downloaded. dunno why?
   *
   * @param {string} url tiktok video url
   * @returns {Promise<Object>}
   */
  async getWebpageInfo(url) {
    return new Promise(async (resolve) => {
      const validate = Utils.isTiktokUrl(url);
      if (validate.status) {
        const video_id = await this.getVideoId(url);
        this.logger.debug(
          `${chalk.white(
            `[${chalk.green(this.getWebpageInfo.name)}:${chalk.green(
              Utils.getHostName(url)
            )}] Extracting webpage info::${chalk.white(video_id.video_id)}`
          )}`
        );

        /**
         * page fetch,
         * sometime error, due connection reset.
         */
        let page;
        try {
          page = await this.client.get(this.to_video_url(url));
        } catch (err) {
          this.logger.error(
            `[${chalk.white(this.getWebpageInfo.name)}] ${chalk.yellow(
              `Error, Something wrong::${err.code}, Try Again!`
            )}`
          );
          resolve({ status: false, message: err.message });
        }
        page = page.data;
        /**
         * parsing json data.
         */
        let univData = new RegExp(
          /(?<=script\sid\="\_\_UNIVERSAL\_DATA\_FOR\_REHYDRATION\_\_\"[^>+]*?\"\>)([^>+].*?)(?=\<\/script\>)/
        ).exec(page);
        if (univData !== null) {
          univData = JSON.parse(univData[1])["__DEFAULT_SCOPE__"][
            "webapp.video-detail"
          ];
          if (univData !== undefined) {
            if ("itemStruct" in univData.itemInfo) {
              univData = univData.itemInfo.itemStruct;
              resolve({
                status: true,
                video_id: univData.id,
                title:
                  univData.imagePost !== undefined
                    ? `${univData.imagePost.title} ${univData.desc}`
                    : univData.desc,
                created: new Date(parseInt(univData.createTime) * 1000)
                  .toLocaleString()
                  .replace(/\//g, "-"),
                thumbnail: univData.video.originCover ?? univData.video.cover,
                author: {
                  username: univData.author.uniqueId,
                  name: univData.author.nickname,
                  user_id: univData.author.id,
                  avatar: univData.author.avatarLarger,
                },
                total_views: univData.stats.playCount,
                total_comment: univData.stats.commentCount,
                music: {
                  url: univData.music.playUrl, // music url sometime return as 403 (access denied), dunno why.
                  title: univData.music.title,
                  author: univData.music.author ?? univData.music.authorName,
                  cover: univData.music.coverLarge,
                },
              });
            } else {
              /**
               * it's sometime return malformed json data.
               * i'm waiting error for debugging, but didn't appear again.
               */
              this.logger.error(
                `[${chalk.white(this.getWebpageInfo.name)}] ${chalk.yellow(
                  `Error while parsing data::\n${chalk.white(
                    JSON.stringify(univData, null, 2)
                  )}`
                )}`
              );
              resolve({
                status: false,
                message: "Error while parsing json data",
              });
            }
          } else {
            this.logger.error(
              `[${chalk.white(this.getWebpageInfo.name)}] ${chalk.yellow(
                "Error, Couldn't find video details!"
              )}`
            );
            resolve({
              status: false,
              message: "no video details found!",
            });
          }
        } else {
          this.logger.error(
            `${chalk.white(this.getWebpageInfo.name)} ${chalk.yellow(
              "Error, Couldn't find video Universal data.!"
            )}`
          );
          resolve({
            status: false,
            message: "no video data found.",
          });
        }
      } else {
        this.logger.error(
          `[${chalk.white(this.getWebpageInfo.name)}] ${chalk.yellow(
            validate.message
          )}`
        );
        resolve(validate);
      }
    });
  }

  /**
   * get short data from oembed api (only work for video type).
   *
   * @param {string} url tiktok url video.
   * @returns {Promise<Object>}
   */
  async getShortInfo(url) {
    return new Promise(async (resolve) => {
      this.logger.debug(
        `${chalk.white(
          `[${chalk.green(this.getShortInfo.name)}] Getting oembed data::${
            (await this.getVideoId(url)).video_id
          }`
        )}`
      );
      const validate = Utils.isTiktokUrl(url);
      if (validate.status) {
        try {
          const res = await this.client.get("https://www.tiktok.com/oembed", {
            params: {
              url: url,
            },
            responseType: "json",
          });
          const data = res.data;
          resolve({
            status: true,
            video_id: data["embed_product_id"],
            title: data["title"],
            thumbnail: data["thumbnail_url"],
            author: {
              name: data["author_name"],
              username: data["author_unique_id"],
            },
          });
        } catch (err) {
          resolve({
            status: false,
            message: err.response.data["message"],
          });
        }
      } else {
        this.logger.error(
          `[${chalk.white(this.getShortInfo.name)}] ${chalk.yellow(
            validate.message
          )}`
        );
        resolve(validate);
      }
    });
  }

  /**
   * DRY: get unique form token.
   * used for <snaptik>, <tikmate>, <ssstik>
   *
   * @param {object} opts options
   * @param {string} opts.host hostname/url.
   * @param {string} opts.page html response page from request session.
   * @returns {Promise<Object>}
   */
  async getToken(opts) {
    let { host, page } = opts;
    return new Promise(async (resolve) => {
      this.logger.debug(
        `${chalk.white(
          `[${chalk.green(this.getToken.name)}] Getting token from::`
        )}${chalk.green(host)}`
      );
      if (!page) {
        page = await this.client.get(host);
        page = page.data;
      }
      let token = new RegExp(
        host.includes("ssstik")
          ? /(?:"tt\:'([\w]*?)'";|s_tt\s=\s'([\w]*?)')/gi
          : /name\=\"_?token"\svalue\=\"([^>*]+?)"/gi
      ).exec(page);
      if (token !== null) {
        resolve({
          status: true,
          token: token[1] ?? token[2],
        });
      } else {
        this.logger.error(
          `[${chalk.white(this.getToken.name)}] ${chalk.yellow(
            `Couldn't get token from::${chalk.white(host)}`
          )}`
        );
        resolve({
          status: false,
          message: "regex not match with token form!",
        });
      }
    });
  }

  /**
   * get video id from tiktok url
   * actually video id stored in everywhere, e.g webpage or embed (tiktok.com/oembed?url=<url>).
   * but this just for make more simple.
   *
   * @param {string} url tiktok url video.
   * @returns {Promise<Object>}
   */
  async getVideoId(url) {
    return new Promise(async (resolve) => {
      if (Utils.urlWebRegex.test(url)) {
        const [video_url, username, video_id] = Utils.urlWebRegex.exec(url);
        resolve({
          status: true,
          ...{ video_url, username, video_id },
        });
      } else {
        if (Utils.urlMobileRegex.test(url)) {
          this.logger.debug(
            `${chalk.white(
              `[${chalk.green(this.getVideoId.name)}] Redirecting url...`
            )}`
          );
          const redirect = await this.client.get(url, {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400,
          });
          resolve(await this.getVideoId(redirect.headers["location"]));
        } else {
          resolve({
            status: false,
            message: `couldn't get video id from, ${url}`,
          });
        }
      }
    });
  }

  /**
   * DRY: deobfuscating html for <snaptik> and <tikmate>.
   *
   * @param {string} html obfuscated html data.
   * @returns {string}
   */
  getInnerHtml(html) {
    assert(
      html !== undefined,
      `${chalk.yellow("no suplied obfuscated html data")}`
    );
    this.logger.debug(
      `${chalk.white(
        `[${chalk.green(this.getInnerHtml.name)}] Deobfuscating HTML Length::${
          html.length
        }`
      )}`
    );
    let params = new RegExp(
      /\(\"(.*?)",(.*?),"(.*?)",(.*?),(.*?),(.*?)\)/i
    ).exec(html);
    if (params !== null) {
      var [h, u, n, t, e, r] = params.slice(1).reduce((t, val) => {
        if (!isNaN(val)) {
          t.push(parseInt(val, 10));
        } else {
          t.push(val);
        }
        return t;
      }, []);

      const alpa =
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";
      const _decode = (d, e, f) => {
        var g = alpa.split("");
        var h = g.slice(0, e);
        var i = g.slice(0, f);
        var j = d
          .split("")
          .reverse()
          .reduce(function (a, b, c) {
            if (h.indexOf(b) !== -1)
              return (a += h.indexOf(b) * Math.pow(e, c));
          }, 0);
        var k = "";
        while (j > 0) {
          k = i[j % f] + k;
          j = (j - (j % f)) / f;
        }
        return k || 0;
      };

      r = "";
      for (var i = 0, len = h.length; i < len; i++) {
        var s = "";
        while (h[i] !== n[e]) {
          s += h[i];
          i++;
        }
        for (var j = 0; j < n.length; j++)
          s = s.replace(new RegExp(n[j], "g"), j);
        r += String.fromCharCode(_decode(s, e, 10) - t);
      }
      const content = new RegExp(/\.innerHTML\s=\s"([^>*].+?)";\s/).exec(
        decodeURIComponent(escape(r))
      );
      if (content !== null) {
        return {
          status: true,
          result: content[1].replace(/\\/g, ""),
        };
      }
      return {
        status: false,
        message: "couldn't deobfuscate html data...",
      };
    } else {
      return {
        status: false,
        message: "malformed html obfuscated data...",
      };
    }
  }

  /**
   * genrate random chars from strings
   *
   * @param {String} chars
   * @param {Integer} length
   * @returns {String}
   */
  getRands(chars, length) {
    return Array.from(
      {
        length: length,
      },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  }
}

export default Init;
