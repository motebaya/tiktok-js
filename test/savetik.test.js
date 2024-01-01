import { execSync } from "node:child_process";
import { deleteCache, exampleUrl } from "./exampleUrl.js";
import chalk from "chalk";

const server = "savetik";
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
   * savetik could render images slider to video.
   * @images->video
   */
  it("rendering video from images should be success and download till complete", () => {
    const output = execSync(
      `node cli.js -u ${exampleUrl.imageWebUrl} -s ${server} -t video -V`
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
   * savetik return video url as array, and extract should be completed.
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
   * support music for both media type.
   * @images/video->music (from webpage/savetik)
   */
  it("music url should be exist and download till complete", () => {
    const output = execSync(
      `node cli.js -u ${exampleUrl.imageWebUrl1} -t music -s ${server} -V`
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
