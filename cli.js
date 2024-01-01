/**
 * @github.com/motebaya - © 2023-10
 * file: cli.js
 * (CLI handler)
 *
 */
import { ArgumentParser, RawTextHelpFormatter } from "argparse";
import { _Main, serverList } from "./main.js";

(async function () {
  const parser = new ArgumentParser({
    description:
      "\tTIktok CLI downloader\n © Copyright: @github.com/motebaya - 2023",
    formatter_class: RawTextHelpFormatter,
  });
  parser.add_argument("-u", "--url", {
    type: "str",
    metavar: "",
    help: "tiktok video url",
  });
  parser.add_argument("-s", "--server", {
    type: "str",
    metavar: "",
    choices: serverList,
    help: `choose server list: ${JSON.stringify(serverList)
      .replace(/"/g, "")
      .replace(/,/g, ", ")}`,
  });
  parser.add_argument("-t", "--type", {
    type: "str",
    metavar: "",
    choices: ["image", "music", "video"],
    help: "choose existing media type: [image, video, music]",
  });

  /**
   * additional.
   * puppeter scraping are extended feature.
   * the main are for downloading videos only from url.
   *
   */
  const group = parser.add_argument_group("additional");
  group.add_argument("-S", "--search", {
    type: "str",
    metavar: "",
    help: "search username/account using puppeteer by suplied query string. min:1, max:100",
  });
  group.add_argument("-d", "--dump", {
    type: "str",
    metavar: "",
    help: "dump bulk user videos using puppeteer by suplied username. min: 35, max: 1000",
  });
  group.add_argument("-l", "--limit", {
    type: "int",
    metavar: "",
    help: "limit arg number",
  });
  group.add_argument("-V", "--verbose", {
    action: "store_true",
    help: "debug mode on",
  });
  const args = parser.parse_args();
  if (args.url && args.server && args.type) {
    console.log(`\n ${parser.description}\n`);
    _Main._extract({
      url: args.url,
      server: args.server.toLowerCase(),
      type: args.type.toLowerCase(),
      verbose: args.verbose,
    });
  } else {
    /**
     * grabber: dump -> save
     * users search: `./{query}_{total}-search.json`
     * videos lists: `./{username}_{total}-videolists.json`
     *
     */
    if (args.search || args.dump) {
      if (args.search && args.limit) {
        _Main.searchUsers({
          query: args.search,
          limit: args.limit,
          verbose: args.verbose,
        });
      } else {
        if (args.dump && args.limit) {
          _Main.dumpVideos({
            username: args.dump,
            limit: args.limit,
            verbose: args.verbose,
          });
        } else {
          parser.print_help();
        }
      }
    } else {
      parser.print_help();
    }
  }
})();
