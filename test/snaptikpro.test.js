import { execSync } from "node:child_process";
import { deleteCache, exampleUrl } from "./exampleUrl.js";
import chalk from "chalk";

const server = "snaptikpro";
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
   * return single video download url.
   * @video->video
   */
  it("video url should be exist and downloaded till complete", () => {
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
   * no music from both media type., but video url should be collected.
   * @video->music
   */
  it(`${server} couldn't download music from images/video type`, () => {
    const output = execSync(
      `node cli.js -u ${exampleUrl.videoWebUrl} -t music -s ${server} -V`
    ).toString();
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/video\surl\scollected/gi))
    );
    expect(output).toEqual(
      expect.stringMatching(
        new RegExp(/this\sserver\scouldn't\sdownload\smusic\sfrom\svideos/gi)
      )
    );
    expect(output).toEqual(
      expect.stringMatching(new RegExp(/extract\scompleted\sin/gi))
    );
  });
});

afterAll(() => {
  deleteCache();
});
