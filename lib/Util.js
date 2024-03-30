/**
 * @github.com/motebaya - © 2023-10
 * file: util.js
 * module utility helper
 *
 */
import zlib from "zlib";
import CryptoJS from "crypto-js";
import ejs from "ejs";

/**
 * trying to secure url params.
 * cc: https://cryptojs.gitbook.io/docs/#encoders
 */
class Utils {
  /**
   * global
   */
  static urlMobileRegex = new RegExp(
    /(?:^http[s]\:\/\/vt\.tiktok\.com\/(?<id>[\w+]*))/
  );
  static urlWebRegex = new RegExp(
    /(?:^https\:\/\/www\.tiktok\.com\/@(?<username>[^\"]*?)\/(?:video|photo)\/(?<id>[0-9]*))/
  );
  static usernameRegex = new RegExp(/^(?:@)?([a-zA-Z0-9_\.]{2,24})$/);

  /**
   * DRY: validate tiktok username.
   * - numbers, underscores, letters, period
   * - min: 2, max: 24
   *
   * @param {string} username required username to validate.
   * @returns {Object}
   */
  static isTiktokUsername(username) {
    if (username !== undefined) {
      if (Utils.usernameRegex.test(username)) {
        return { status: true };
      }
      return {
        status: false,
        message: `invalid tiktok username ${username}!`,
      };
    }
    return {
      status: false,
      message: "no username suplied...",
    };
  }

  /**
   * DRY: validate tiktok video url.
   * - webpage: https://www.tiktok.com/<username>/video/<video id>?params....
   * - mobile: https://vt.tiktok.com/<short id>/
   *
   * @param {string} url tiktok url video.
   * @returns {Object}
   */
  static isTiktokUrl(url) {
    if (url !== undefined) {
      if (Utils.urlMobileRegex.test(url) || Utils.urlWebRegex.test(url)) {
        return { status: true };
      }
      return { status: false, message: "invalid tiktok video url!" };
    }
    return { status: false, message: "no suplied url..." };
  }

  /**
   * DRY: get hostname from url
   *
   * @param {string} url any
   * @returns {string}
   */
  static getHostName(url) {
    return new URL(url).hostname;
  }

  /**
   * no built'in func title case.
   *
   * @param {string} string string.
   * @returns {string}
   */
  static toTitleCase(string) {
    return string.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  /**
   * DRY: get fields by method type from request object.
   *
   * @param {Object} req
   * @returns {Object}
   */
  static getFields(req) {
    return new RegExp(/^get$/gi).test(req.method)
      ? req.query
      : new RegExp(/^post$/gi).test(req.method)
      ? req.body
      : undefined;
  }

  /**
   * render data result from extractor with ejs.
   *
   * @param {object} data response data from extractor
   * @returns {Promise<string>}
   */
  static async renderEjs(data) {
    return new Promise(async (resolve) => {
      resolve(await ejs.renderFile("views/content.ejs", data, { async: true }));
    });
  }
  /**
   *
   * @param {string} text string to enc.
   * @returns {string}
   */
  static encryptStr(text) {
    return encodeURIComponent(
      zlib
        .deflateSync(
          CryptoJS.AES.encrypt(
            encodeURIComponent(text),
            process.env.SECRET_KEY
          ).toString()
        )
        .toString("base64")
    );
  }

  /**
   *
   * @param {string} text enxrypted plain text from this.encryptStr.
   * @returns {string}
   */
  static decryptStr(text) {
    try {
      return decodeURIComponent(
        CryptoJS.AES.decrypt(
          zlib.inflateSync(Buffer.from(text, "base64")).toString(),
          process.env.SECRET_KEY
        ).toString(CryptoJS.enc.Utf8)
      );
    } catch (err) {
      console.log(` failed decrypt content due: ${err.message}`);
      return;
    }
  }

  /**
   * short longest string token params in url.
   * e.g: for tikmate have 3k+ token length,
   *
   */
  static shortToken(url) {
    const t = new URL(url);
    if (t.searchParams.has("token")) {
      t.searchParams.set(
        "token",
        `${t.searchParams.get("token").slice(0, 20)}...`
      );
      return t.toString();
    }
    return url;
  }
}

export default Utils;
