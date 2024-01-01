import { execSync } from "node:child_process";
import { deleteCache, exampleUrl } from "./exampleUrl.js";
import chalk from "chalk";

const server = "tikmate";
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
   * tikmate no need to render separately, the website could render directly.
   * @images->video
   */
  it("video from images type should be exist and download till complete", () => {
    const output = execSync(
      `node cli.js -u ${exampleUrl.imageWebUrl} -s ${server} -t video -V`
    ).toString();
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/found\svideo\sfrom\simages\sslider/gi))
    );
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/extract\scompleted\sin/gi))
    );
  });

  /**
   * tikmate video url return single url, not list.
   * and extract should be completed.
   * @video->video
   */
  it("video url should be exist and download till complete", () => {
    const output = execSync(
      `node cli.js -u ${exampleUrl.videoWebUrl} -s ${server} -t video -V`
    ).toString();
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/video\surl\scollected/gi))
    );
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/extract\scompleted\sin/gi))
    );
  });

  /**
   * tikamte could download music,
   * because music collected from webpage if type media is images.
   * @images->music (from webpage)
   * @video->music (not supported)
   */
  it("music from images type (webpage) should be exist and download till complete", () => {
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
