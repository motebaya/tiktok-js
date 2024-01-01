import { execSync } from "node:child_process";
import { deleteCache, exampleUrl } from "./exampleUrl.js";
import chalk from "chalk";

const server = "snaptik";
describe(`Testing::${chalk.yellow(server)} server...`, () => {
  /**
   * images list should have at least 1 images to download.
   * @images->images
   */
  it("images list should be more than equal 1 and download till complete", () => {
    const output = execSync(
      `node cli.js -u ${exampleUrl.imageMobileUrl} -s ${server} -t image -V`
    ).toString();
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/[1-9]+\simages\scollected/gi))
    );
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/extract\scompleted\sin/gi))
    );
  });

  /**
   * snaptik could render, but it couldn't directly download url.
   * success get images, but skip render images video, so video to download.
   * @images->video (not supported)
   */
  it("images should be collected, render video skipped, and nothing video to download", () => {
    const output = execSync(
      `node cli.js -u ${exampleUrl.imageWebUrl} -s ${server} -t video -V`
    ).toString();
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/[1-9]+\simages\scollected/gi))
    );
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/there's\sno\svideo\sto\sdownload/gi))
    );
  });

  /**
   * videos server/list should more than 1 to download it,
   * and extract should be completed.
   * @video->video
   */
  it("videos server should be more than equal 1 and download till complete", () => {
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
   * snaptik only support music if media type is images.
   * reff:
   * @images->music
   * @video->music (not supported)
   */
  it("music should be exist and download till complete", () => {
    const output = execSync(
      `node cli.js -u ${exampleUrl.imageMobileUrl} -t music -s ${server} -V`
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
