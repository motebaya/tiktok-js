import { execSync } from "child_process";
import { exampleUrl, deleteCache } from "./exampleUrl.js";
import chalk from "chalk";

const server = "tikcdn";
describe(`Testing::${chalk.yellow(server)} servers..`, () => {
  /**
   * images list should have at least 1 images to download.
   * @images->images
   */
  it("images list should be more than equal 1 and downloaded till complete", () => {
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
   * tikcdn doesn't support for video images slider.
   * @images->video (not supported)
   */
  it(`${server} does not supported video from images slider type`, () => {
    expect(
      execSync(
        `node cli.js -u ${exampleUrl.imageMobileUrl} -s ${server} -t video`
      ).toString()
    ).toEqual(
      expect.stringMatching(new RegExp(/there's\sno\svideo\sto\sdownload/gi))
    );
  });

  /**
   * tikcdn have 2 video url, the site say other one is "HD".
   * @video->video
   */
  it("videos server should be more than equal 1 and downloaded till complete...", () => {
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
   * tikcdn support music from both type.
   * @video/images->music
   */
  it("music should be exist and download till completed", () => {
    const output = execSync(
      `node cli.js -u ${exampleUrl.imageWebUrl} -t music -s ${server}`
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
