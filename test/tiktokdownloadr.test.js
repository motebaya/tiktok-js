import { execSync } from "node:child_process";
import { deleteCache, exampleUrl } from "./exampleUrl.js";
import chalk from "chalk";

const server = "tiktokdownloadr";
describe(`Testing::${chalk.yellow(server)} server...`, () => {
  /**
   * this server only support for videos only.
   * @images->images
   */
  it(`${server} couldn't download images type`, () => {
    expect(
      execSync(
        `node cli.js -u ${exampleUrl.imageMobileUrl} -s ${server} -t image -V`
      ).toString()
    ).toEqual(
      expect.stringMatching(
        new RegExp(/this\sserver\sonly\ssupport\sfor\svideo\stype/gi)
      )
    );
  });

  /**
   * videos server/list should more than 1 to download it,
   * and extract should be completed.
   * @video->video
   */
  it("videos server should be more than equal 1 and downloaded till complete", () => {
    const output = execSync(
      `node cli.js -u ${exampleUrl.videoWebUrl} -s ${server} -t video -V`,
      {
        input: "0\n",
      }
    ).toString();
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/[1-9]+\svideos\sserver\scollected/gi))
    );
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/extract\scompleted\sin/gi))
    );
  });

  /**
   * only could download music if type media is video.
   * @video->music
   */
  it("music from video type should be exist and download till complete", () => {
    const output = execSync(
      `node cli.js -u ${exampleUrl.videoWebUrl} -t music -s ${server} -V`
    ).toString();
    expect(output).toEqual(expect.stringMatching(new RegExp(/\*\smusic\:/gi)));
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/extract\scompleted\sin/gi))
    );
  });
});

afterAll(() => {
  deleteCache();
});
