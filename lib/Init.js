/**
 * @github.com/motebaya - © 2023-10
 * file: init.js
 */
import axios from "axios";
import * as AxiosLogger from "axios-logger";
import logger from "./logger/logging.js";
import cheerio from "cheerio";
import he from "he";

/**
 * AxiosLogger: https://github.com/hg-pyun/axios-logger#enable-config-list
 */
class Init {
  /**
   * init ,client instance and etc.
   */
  constructor(verbose = false) {
    this.verbose = verbose;
    this.logger = logger(this.verbose ? "debug" : "info");
    this.innerRegex = new RegExp(/\.innerHTML\s=\s"([^>*].+?)";\s/);
    this.regex = new RegExp(
      /(?:https\:\/\/www\.tiktok\.com\/@[^\"]*?\/video\/(?<id>[0-9]*))/
    );
    this.regexRedirect = new RegExp(
      /(?:http[s]\:\/\/vt\.tiktok\.com\/(?<id>[\w+]*))/
    );
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
        headers: true,
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
   * Just DRY.
   * @params string url: tiktok video url
   * @return string
   *
   */
  isTiktokUrl(url) {
    if (url !== undefined) {
      return this.regex.test(url) || this.regexRedirect.test(url);
    }
    this.logger.error(`invalid suplied tiktok url for: ${url}`);
    return;
  }

  /**
   * alternate get video data, bcs oembed api not supported for images.
   * TODO: parse json data from JS tag and decode html entities.
   * @params string webpage: html response webpage from tiktok video.
   * @return string json.
   *
   */
  get_sigi_data(webpage) {
    this.logger.debug(
      `Getting metadata from webpage length: ${webpage.length}`
    );
    const sigi_data = new RegExp(
      /(?<=script\sid\="SIGI\_STATE\"[^>+]*?\"\>)([^>+].*?)(?=\<\/script\>)/
    ).exec(webpage);
    if (sigi_data !== null) {
      return he.decode(sigi_data[1]);
    }
    this.logger.error("Cannot get metadata from webpage!");
    return;
  }

  /**
   * get video information from webpage
   * @params string url: tiktok video url
   * @return Object json
   *
   */
  async get_webpage_info(url) {
    this.logger.debug(`Getting info from webpage url: ${url}`);
    return new Promise(async (resolve) => {
      if (this.isTiktokUrl(url)) {
        let webpage = await this.client.get(url);
        webpage = webpage.data;
        const $ = cheerio.load(webpage);
        let video_id = this.regex.exec(
          $('meta[property="og:url"]').attr("content")
        )[1];
        let data = this.get_sigi_data(webpage);
        if (data !== undefined) {
          data = JSON.parse(data);
          let ItemModule = data.ItemModule[video_id];

          resolve({
            status: true,
            video_id: video_id,
            title: ItemModule.desc,
            created: new Date(parseInt(ItemModule.createTime) * 1000)
              .toLocaleString()
              .replace(/\//g, "-"),
            total_views: ItemModule.stats.playCount,
            total_comment: ItemModule.stats.commentCount,
            author: {
              username: ItemModule.author,
              name: ItemModule.nickname,
              user_id: ItemModule.authorId,
              avatar: data.UserModule.users[ItemModule.author].avatarLarger,
            },
          });
        } else {
          this.logger.error(`empty metadata response from url: ${url}!`);
          resolve({
            status: false,
            message: "cannot get metadata",
          });
        }
      } else {
        this.logger.error("invalid suplied url video!");
        resolve({
          status: false,
          message: "invalid url video",
        });
      }
    });
  }

  /**
   * get shortly/simply tiktok video info from embed video
   * @params string url
   * @return object json
   *
   */
  async get_short_info(url) {
    this.logger.debug(`getting oembed info from url: ${url}`);
    return new Promise(async (resolve) => {
      if (this.isTiktokUrl(url)) {
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
          if (err.response && err.response.status === 400) {
            resolve({
              status: false,
              message: err.response.data["message"],
            });
          }
        }
      } else {
        this.logger.error("invalid suplied url video!");
        resolve({
          status: false,
          message: "invalid url video",
        });
      }
    });
  }

  /**
   * get unique token from input form, used for snaptik, tikmate.
   *
   * @params string host: host spesified.
   * @return object json
   *
   */
  async get_token(host) {
    return new Promise(async (resolve) => {
      const res = await this.client.get(host);
      const token = new RegExp(/name\=\"token"\svalue\=\"([^>*]+?)"/gi).exec(
        res.data
      );
      if (token !== null) {
        resolve({
          status: true,
          token: token[1],
        });
      } else {
        this.logger.error("Failed get token data!");
        resolve({
          status: false,
          token: token,
          message: "something went wrong, while getting token!",
        });
      }
    });
  }

  /**
   * get video id from tiktok url
   * alternate can get id from embed -> https://www.tiktok.com/oembed?url=<url>
   * @params string url: tiktok video url
   * @return object json
   */
  async get_video_id(url) {
    return new Promise(async (resolve) => {
      if (url !== undefined && this.isTiktokUrl(url)) {
        if (this.regexRedirect.test(url)) {
          this.logger.debug(`Redirect: ${url}`);
          let r = await this.client.get(url, {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400,
          });
          resolve(await this.get_video_id(r.headers["location"]));
        } else if (this.regex.test(url)) {
          let rg = this.regex.exec(url);
          resolve({
            status: true,
            url: rg[0],
            video_id: rg[1],
          });
        } else {
          resolve({
            status: false,
          });
        }
      } else {
        this.logger.error("invalid suplied url video!");
        resolve({
          status: false,
          message: "invalid url video",
        });
      }
    });
  }

  /**
   * DRE
   */
  get_inner_html(data) {
    if (data !== undefined) {
      this.logger.debug("Deobfuscating innerHtml..");
      const content = this.innerRegex.exec(this.deobfuscate_html(data));
      return content !== null ? content[1].replace(/\\/g, "") : undefined;
    }
    this.logger.error("data required to deobfuscated!");
    process.exit(0);
  }

  /**
   * deobfsucate html from snaptik JS reponse.
   * @params string html: obfuscated javascript response.
   * @see snap.js
   *
   */
  deobfuscate_html(html) {
    if (html !== undefined) {
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
        return decodeURIComponent(escape(r));
      }
    }
  }
}

export default Init;
