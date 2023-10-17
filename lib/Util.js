/**
 * @github.com/motebaya - © 2023-10
 * file: util.js
 * module utilities helper
 */
import zlib from "zlib";
import CryptoJS from "crypto-js";

// https://cryptojs.gitbook.io/docs/#encoders
export const encryptStr = (text) => {
  return zlib
    .deflateSync(
      CryptoJS.AES.encrypt(
        encodeURIComponent(text),
        process.env.SECRET_KEY
      ).toString()
    )
    .toString("base64");
};

export const decryptStr = (text) => {
  try {
    return decodeURIComponent(
      CryptoJS.AES.decrypt(
        zlib.inflateSync(Buffer.from(text, "base64")).toString(),
        process.env.SECRET_KEY
      ).toString(CryptoJS.enc.Utf8)
    );
  } catch (err) {
    console.log(`failed decrypt content due: ${err.message}`);
    return;
  }
};
