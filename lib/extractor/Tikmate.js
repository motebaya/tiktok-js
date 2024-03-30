/**
 * @github.com/motebaya - © 2023-10
 * file: tikmate.js
 */
import Init from "../Init.js";
import FormData from "form-data";
import cheerio from "cheerio";
import chalk from "chalk";
import Utils from "../Util.js";

class Tikmate extends Init {
  /**
   * global
   */
  static host = "https://tikmate.io";

  /**
   * Init
   *
   * @param {boolean} verbose debug/verbose
   */
  constructor(verbose) {
    super(verbose);
    this.host = Tikmate.host;
    this.session_client = this.createSession(this.host);
  }

  /**
   * extract video data from url.
   *
   * @param {object} opts options
   * @param {string} url tiktok video url.
   * @returns {Promise<Object>}
   */
  async getVideoData(opts) {
    const { url } = opts;
    return new Promise(async (resolve) => {
      const validate = Utils.isTiktokUrl(url);
      if (validate.status) {
        this.logger.debug(
          `${chalk.white(
            `[${chalk.green(this.getVideoData.name)}:${chalk.green(
              Utils.getHostName(this.host)
            )}} Extracting data::${chalk.green(
              (await this.getVideoId(url)).video_id
            )}`
          )}`
        );
        const token = await this.getToken({
          host: this.host,
          page: (await this.session_client.get(this.host)).data,
        });
        console.log(token);
        if (token.status) {
          const form = new FormData();
          form.append("token", token.token);
          form.append("url", this.to_video_url(url));
          const page = await this.session_client.post(
            `${this.host}/abc.php`,
            form,
            {
              headers: {
                Host: Utils.getHostName(this.host),
                Origin: this.host,
                "Content-Type": "application/x-www-form-urlencoded",
                Referer: `${this.host}/`,
              },
            }
          );
          const innerHTML = this.getInnerHtml(page.data);
          if (innerHTML.status) {
            const $ = cheerio.load(innerHTML.result);
            /**
             * tikmate support images slide show and
             * no need render separately.
             */
            let result;
            const images = $("img.card-img-top");
            const videos = $('a[class*="abutton"]').attr("href");
            if (images.length !== 0) {
              this.logger.debug(
                `${chalk.white(
                  `[${chalk.green(this.getVideoData.name)}:${chalk.green(
                    Utils.getHostName(this.host)
                  )}] ${chalk.green(images.length)} Images Collected...`
                )}`
              );
              /**
               * same as snaptik.app, there's no music from site.
               */
              result = {
                ...(await this.getWebpageInfo(url)),
                status: true,
                isImage: true,
                images: images
                  .map((i, e) => {
                    return $(e).attr("src");
                  })
                  .get(),
                videos: videos ?? "#",
              };
            } else {
              result = {
                ...(await this.getWebpageInfo(url)),
                status: true,
                isImage: false,
                videos: videos,
              };
              this.logger.debug(
                `${chalk.white(
                  `[${chalk.green(this.getVideoData.name)}:${chalk.green(
                    Utils.getHostName(this.host)
                  )}] Video Url Collected...`
                )}`
              );
            }
            resolve(result);
          } else {
            this.logger.error(
              `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
                innerHTML.message
              )}`
            );
            resolve(innerHTML);
          }
        } else {
          this.logger.error(
            `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
              token.message
            )}`
          );
          resolve(token);
        }
      } else {
        this.logger.error(
          `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
            validate.message
          )}`
        );
        resolve(validate);
      }
    });
  }
}

export default Tikmate;
