/**
 * @github.com/motebaya - © 2023-10
 * file: tikmate.js
 */
import Init from "../Init.js";
import FormData from "form-data";
import cheerio from "cheerio";

class Tikmate extends Init {
  constructor(verbose) {
    super(verbose);
    this.host = "https://tikmate.online";
  }

  /**
   * get video data from url.
   * @params video_url: <sepsific tiktok video url>
   * @return json
   *
   */
  async get_video_data(url) {
    this.logger.debug(`Extracting video from url: ${url}`);
    return new Promise(async (resolve) => {
      if (url !== undefined) {
        let token = await this.get_token(this.host);
        if (token.status) {
          token = token.token;
          const form = new FormData();
          form.append("token", token);
          form.append("url", url);

          const res = await this.client.post(`${this.host}/abc.php`, form, {
            headers: {
              Host: "tikmate.online",
              Origin: this.host,
              "Content-Type": "application/x-www-form-urlencoded",
              Referer: `${this.host}/`,
            },
          });
          const content = this.get_inner_html(res.data);
          if (content !== undefined) {
            const $ = cheerio.load(content);
            const images = $("img.card-img-top");
            let download_url = $("a.abutton").attr("href");
            download_url = download_url !== undefined ? download_url : "-";

            if (images.length !== 0) {
              this.logger.debug(`${images.length} Images Collected!`);
              let short_info = await this.get_webpage_info(url);
              short_info = short_info.status
                ? { ...short_info, isImage: true }
                : {
                    status: true,
                    isImage: true,
                  };

              short_info.images = images
                .map((i, e) => {
                  return $(e).attr("src");
                })
                .get();
              short_info.videos = download_url;
              resolve(short_info);
            } else {
              let short_info = await this.get_short_info(url);
              short_info = short_info.status
                ? short_info
                : {
                    status: true,
                    isimage: false,
                  };
              short_info.videos = download_url;
              resolve(short_info);
            }
          } else {
            this.logger.error("failed extracting data, null response!");
            resolve({
              status: false,
              message: "failed get content data!",
            });
          }
        } else {
          resolve(token);
        }
      }
    });
  }
}

export default Tikmate;
