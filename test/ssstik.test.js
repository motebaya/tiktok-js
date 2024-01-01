import { execSync } from "node:child_process";
import { deleteCache, exampleUrl } from "./exampleUrl.js";
import chalk from "chalk";

const server = "ssstik";
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
   * ssstik could render images to videos, although it takes a bit of time.
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
   * ssstik video url return single url, not list.
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
   * sstik could download music.
   * @video->music (from ssstik)
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

  /**
   * sstik could download music, but different source if media type is images.
   * @images->music (from webpage)
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
