import { execSync } from "node:child_process";
import { exampleUrl, deleteCache } from "./exampleUrl.js";
import chalk from "chalk";

const server = "musicaldown";
describe(`Testing::${chalk.yellow(server)} server...`, () => {
  /**
   * images list should have at least 1 images to download.
   * @images->images
   */
  it("images should be more than equal 1 and downloaded till complete", () => {
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
   * CLI optional render for image type when choosed type is video.
   * render -> ok -> download.
   * @images->video
   */
  it("render video should be success, and download till complete.", () => {
    const output = execSync(
      `node cli.js -u ${exampleUrl.imageMobileUrl} -s ${server} -t video -V`
    ).toString();
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/rendering\ssuccess/gi))
    );
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/found\svideo\sfrom\simages\sslider/gi))
    );
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/extract\scompleted\sin/gi))
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
   * music from images type sometime return 403, because it different source.
   * @video-> music -> from musicaldown.
   */
  it("music from musicaldown should be exist and download till completed. ", () => {
    const output = execSync(
      `node cli.js -u ${exampleUrl.videoWebUrl} -t music -s ${server} -V`
    ).toString();
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/extracting\smusic\sdata/gi))
    );
    expect(output).toEqual(expect.stringMatching(new RegExp(/\*\smusic\:/gi)));
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/extract\scompleted\sin/gi))
    );
  });

  /**
   * music from webpage.
   * @images-> music -> form webpage.
   */
  it("music from webpage should be return stream response, and download till completed. ", () => {
    const output = execSync(
      `node cli.js -u ${exampleUrl.imageWebUrl} -t music -s ${server} -V`
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
