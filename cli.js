/**
 * @github.com/motebaya - © 2023-10
 * file: cli.js
 * (CLI handler)
 */
import { ArgumentParser, RawTextHelpFormatter } from "argparse";
import { _extract } from "./main.js";

const fnMain = async () => {
  const parser = new ArgumentParser({
    description: " TIktok CLI downloader\n © Copyright: @github.com/motebaya",
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
    choices: ["aweme", "snaptik", "tikmate"],
    help: "choose server list: [snaptik, tikmate, aweme]",
  });
  parser.add_argument("-t", "--type", {
    type: "str",
    metavar: "",
    choices: ["image", "music", "video"],
    help: "choose existing media type: [image, video, music]",
  });

  // additional
  const group = parser.add_argument_group("additional");
  group.add_argument("-V", "--verbose", {
    action: "store_true",
    help: "debug mode on",
  });
  const args = parser.parse_args();
  if (args.url && args.server && args.type) {
    console.log(`\n ${parser.description}\n`);
    await _extract({
      url: args.url,
      server: args.server.toLowerCase(),
      type: args.type.toLowerCase(),
      verbose: args.verbose,
    });
  } else {
    parser.print_help();
  }
};

fnMain();
