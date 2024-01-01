/**
 * Puppeter tiktok user scrapper.
 * @github.com/moteabaya - 9.11.2023 8.06 PM
 * file: Users.js
 */
import Init from "./Init.js";
import chalk from "chalk";
import assert from "node:assert";
import Utils from "./Util.js";

/**
 * CLI only.
 * because need run chromium and live interact with user.
 * (solved puzzle)
 *
 */
class Users extends Init {
  constructor(verbose) {
    super(verbose);
    this.host = "https://www.tiktok.com";
  }

  /**
   * get video url from user bases suplied username. limit !== truly equal.
   *
   * @param {object} opts
   * @param {string} opts.username tiktok username (without @).
   * @param {number} opts.limit limit video to grab. default: 1000.
   *
   * @returns {Promise<Object>}
   */
  async getUserVideos(opts) {
    const { username, limit } = opts;
    const validate = Utils.isTiktokUsername(username);
    assert(validate.status, chalk.red(validate.message));
    assert(
      Number.isInteger(limit) && limit <= 1000,
      chalk.red(`grab bulk limit must be less than 1000`)
    );

    return new Promise(async (resolve) => {
      this.logger.debug(
        `${chalk.white(
          `[${chalk.green(this.getUserVideos.name)}] Grabbing Videos List::`
        )}@${chalk.green(username)}`
      );
      const { browser, page } = await this.getBrowser();
      await page.goto(`${this.host}/@${username}`, {
        waitUntil: "networkidle0",
      });
      /**
       * start getting video data.
       * the captcha puzzle sometime suddenly appear, cuz it need check every time.
       * default per page/35 item.
       *
       */
      let nonStop;
      let videoLists;
      while (!nonStop) {
        if (
          (await page.evaluate(
            'document.querySelector(".captcha_verify_container");'
          )) !== null
        ) {
          this.logger.warn(
            `[${chalk.white(this.getUserVideos.name)}] Please Solve ${chalk.red(
              "Captcha/Puzzle"
            )} Manually!`
          );
        } else {
          videoLists = await page.evaluate(() => {
            return Array.from(
              document.querySelectorAll(
                '[class*="DivVideoFeedV2"] > [class*="DivItemContainerV2"] div[class*="DivWrapper"] > a'
              )
            ).map((e) => {
              return e.getAttribute("href").split("/").slice(-1)[0];
            });
          });
          if (videoLists !== undefined && videoLists.length !== 0) {
            this.logger.info(
              `${chalk.white(
                `[${chalk.green(this.getUserVideos.name)}] Grabbing::`
              )}${chalk.green(videoLists.length)} Videos..`
            );
            if (videoLists.length >= limit) {
              this.logger.info(
                `${chalk.white(
                  `[${chalk.green(this.getUserVideos.name)}] Limit Reached::`
                )}${chalk.green(videoLists.length)} OF ${chalk.yellow(limit)}`
              );
              nonStop = true;
            }
          }

          let prevHeight = await page.evaluate("document.body.scrollHeight");
          await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
          await page
            .waitForFunction(`document.body.scrollHeight > ${prevHeight}`, {
              timeout: 5000,
            })
            .catch(() => {
              this.logger.warn(`no data anymore ...`);
              if (videoLists.length !== 0) {
                this.logger.info(
                  `${chalk.white(
                    `[${chalk.green(
                      this.getUserVideos.name
                    )}] Total Last Data::`
                  )}${videoLists.length}`
                );
                nonStop = true;
              } else {
                this.logger.info(
                  `${chalk.white(
                    `[${chalk.green(this.getUserVideos.name)}]`
                  )}${chalk.yellow("Waiting Page Scrollable")}...`
                );
              }
            });
        }
        // delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      await browser.close();
      resolve({ videos: videoLists });
    });
  }

  /**
   * get short data from tiktok username.
   * match: total followers/following/likes. etc.
   *
   * @param {string} username tiktok username
   * @returns {Promise<object>}
   */
  async getUserData(username) {
    const validate = Utils.isTiktokUsername(username);
    assert(validate.status, chalk.red(validate.message));
    return new Promise(async (resolve) => {
      const { browser, page } = await this.getBrowser({ headless: "new" });
      this.logger.debug(
        `${chalk.white(
          `[${chalk.green(this.getUserData.name)}] Getting data from ::`
        )}@${username}`
      );
      await page.goto(`${this.host}/@${username}`, {
        waitUntil: "networkidle0",
      });
      const details = await page.evaluate(() => {
        return {
          bio: document.querySelector('[class*="H2ShareDesc"]').innerText,
          name: document.querySelector('[class*="H2ShareSubTitle"]').innerText,
          ...Array.from(
            document
              .querySelector('[class*="H3CountInfos"]')
              .querySelectorAll("div")
          ).reduce((dat, e) => {
            dat[e.querySelector("span").innerText.toLocaleLowerCase()] =
              e.querySelector("strong").innerText;
            return dat;
          }, {}),
        };
      });
      await browser.close();
      resolve({
        username: `@${username}`,
        ...details,
      });
    });
  }

  /**
   * search user based suplied string query.
   * match: username/name.
   * it need solve captcha puzzle manually.
   *
   * @param {string} query username which want to search.
   * @param {number} limit set how much username to search. default 100.
   * @returns {Promise<Object>}
   */
  async searchUser(opts) {
    const { query, limit } = opts;
    const validate = Utils.isTiktokUsername(query);
    assert(validate.status, chalk.red(validate.message));
    assert(
      Number.isInteger(limit) && limit <= 100,
      chalk.red("limit search should be less than 100..")
    );
    return new Promise(async (resolve) => {
      this.logger.debug(
        `${chalk.white(
          `[${chalk.green(this.searchUser.name)}] Searching User:: `
        )}${chalk.green(query)}`
      );
      const { browser, page } = await this.getBrowser();
      await page.goto(
        `${this.host}/search/user?lang=en&q=${query}&t=${Math.floor(
          Date.now() / 1000
        )}`
      );

      let userList;
      let firstScrolledUp = false;
      let nonStop = false;
      while (!nonStop) {
        if (
          (await page.evaluate(
            'document.querySelector(".captcha_verify_container");'
          )) !== null
        ) {
          this.logger.warn(
            `${chalk.white(
              `[${chalk.green(this.searchUser.name)}] Please Solve ${chalk.red(
                "Captcha/Puzzle"
              )} Manually!`
            )}`
          );
        } else {
          userList = await page.evaluate(() => {
            return Array.from(
              document.querySelectorAll('[id^="search_user-item-user-link"]')
            ).map((e) => {
              const infoWrapper = e.querySelector(
                'a[class*="StyledDivInfoWrapper"]'
              );
              const elName = infoWrapper.querySelector(
                'p[class*="UserSubTitle"]'
              );
              return {
                name:
                  elName !== null
                    ? elName.innerText
                    : infoWrapper
                        .querySelector('p[class*="DivSubTitleWrapper"]')
                        .innerText.split(/\s/)[0],
                username:
                  infoWrapper.querySelector('p[class*="PTitle"]').innerText,
              };
            });
          });

          if (userList !== undefined && userList.length !== 0) {
            this.logger.info(
              `${chalk.white(
                `[${chalk.green(this.searchUser.name)}] Grabbing::${chalk.green(
                  userList.length
                )} users`
              )}`
            );
            if (userList.length >= limit) {
              this.logger.info(
                `${chalk.white(
                  `[${chalk.green(
                    this.searchUser.name
                  )}] Limit Reached::${chalk.green(
                    userList.length
                  )} OF ${chalk.yellow(limit)}`
                )}`
              );
              nonStop = true;
            }
            /**
             * emm,this dunno why when puppeteer opened page doesn't start at top.
             * so, i need check and scrolled to top first, before scroll down and collect more element.
             * it will be waiting if any captcha or not scrollable page.
             *
             */
            if (!firstScrolledUp) {
              firstScrolledUp = await page.evaluate(() => {
                const overflowType = window.getComputedStyle(
                  document.body
                ).overflowY;
                if (overflowType === "visible" || overflowType === "auto") {
                  if (window.scrollY !== 0) {
                    window.scrollTo(0, 0);
                    return true;
                  }
                  return false;
                }
              });
            }
          }

          let prevHeight = await page.evaluate("document.body.scrollHeight");
          await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
          await page
            .waitForFunction(`document.body.scrollHeight > ${prevHeight}`, {
              timeout: 5000,
            })
            .catch(() => {
              this.logger.warn(
                `[${chalk.white(this.searchUser.name)}] No data anymore...`
              );
              if (userList.length !== 0) {
                this.logger.info(
                  `${chalk.white(
                    `[${chalk.green(
                      this.searchUser.name
                    )}] Users Collected::${chalk.green(userList.length)}`
                  )}`
                );
                nonStop = true;
              } else {
                this.logger.info(
                  `${chalk.white(
                    `[${chalk.green(this.searchUser.name)}] ${chalk.yellow(
                      "Waiting Page Scrollable"
                    )}...`
                  )}`
                );
              }
            });
        }
        // 1s delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      await browser.close();
      resolve(userList);
    });
  }
}

export default Users;
