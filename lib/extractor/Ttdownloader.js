/**
 * @github.com/motebaya - 12.22.2023
 * fiile: Ttdownloader.js
 */
import chalk from "chalk";
import Init from "../Init.js";
import cheerio from "cheerio";
import Utils from "../Util.js";

/**
 * only support for video.
 */
class Ttdownloader extends Init {
  /**
   * global
   */
  static host = "https://ttdownloader.com";

  /**
   * init
   *
   * @param {boolean} verbose debug/verbose.
   */
  constructor(verbose) {
    super(verbose);
    this.host = Ttdownloader.host;
    this.session_client = this.createSession(this.host);
  }

  /**
   * extract video data from url
   *
   * SERVER BUG: sometime music content couldn't be downloaded,
   * even i try it on browser or using IDM.
   *
   * @param {object} opts options
   * @returns {Promise<Object>}
   */
  async getVideoData(opts) {
    const { url } = opts;
    return new Promise(async (resolve) => {
      this.logger.debug(
        `${chalk.white(
          `[${chalk.green(this.getVideoData.name)}:${chalk.green(
            Utils.getHostName(this.host)
          )}} Extracting data::${chalk.green(
            (await this.getVideoId(url)).video_id
          )}`
        )}`
      );
      const validate = Utils.isTiktokUrl(url);
      if (validate.status) {
        let result = await this.getShortInfo(url);
        if (result.status) {
          let page = await this.session_client.get(`${this.host}/`);
          const token = await this.getToken({
            host: this.host,
            page: page.data,
          });
          if (token.status) {
            page = await this.session_client.post(`${this.host}/search/`, {
              format: "",
              token: token.token,
              url: url,
            });
            const $ = cheerio.load(page.data);
            const eldownload = $('div[class="result"]').find(
              'div[class="download"]'
            );
            if (eldownload.length !== 0) {
              this.logger.debug(
                `${chalk.white(
                  `[${chalk.green(this.getVideoData.name)}:${chalk.green(
                    Utils.getHostName(this.host)
                  )}] ${chalk.green(eldownload.length)} Media Collected...`
                )}`
              );
              /**
               * ttdownload music couldn't be downloaded without cookies.
               * so,i'il get it from webpage .even thought music url from webpage
               * sometime not working too.
               */
              const webpageResult = await this.getWebpageInfo(url);
              if (webpageResult.status) {
                result = webpageResult;
              }
              eldownload.each((i, e) => {
                let label = $(e).prev().text().toLocaleLowerCase();
                if (new RegExp(/no\swatermark/gi).test(label)) {
                  result.videos = $(e).find("a").attr("href");
                } else if (new RegExp(/audio\sonly/gi).test(label)) {
                  if (!result.music) {
                    result.music = {
                      title: "-",
                      url: $(e).find("a").attr("href"),
                    };
                  }
                }
              });
              resolve(result);
            } else {
              this.logger.error(
                `[${chalk.white(Utils.getHostName(this.host))}] ${chalk.yellow(
                  "Couldn't find download url!"
                )}`
              );
              resolve({
                status: false,
                message: "failed extract, couldn't find download url!",
              });
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
              "This server only support for video type...!"
            )}`
          );
          resolve({
            ...result,
            message: `server '${this.constructor.name}' does not support for images type.`,
          });
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

export default Ttdownloader;
