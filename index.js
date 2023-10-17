/**
 * @github.com/motebaya - © 2023-10
 * file: index.js
 */
import { config } from "dotenv";
config();
import express from "express";
import url from "url";
import router from "./routes/index.js";
import path from "path";
import minifyHTML from "express-minify-html";
import bodyParser from "body-parser";
import logger from "./lib/logger/logging.js";
import morgan from "morgan";

const app = express();
const port = process.env.PORT;
const base = url.fileURLToPath(new URL(".", import.meta.url));

// morgan log
app.use(
  morgan(
    ":remote-addr :method :url :status :res[content-length] - :response-time ms",
    {
      stream: {
        write: (message) => {
          logger({ level: "debug", longformat: true }).http(message);
        },
      },
    }
  )
);

// body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// minify html response
app.use(
  minifyHTML({
    override: true,
    exception_url: false,
    htmlMinifier: {
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      minifyJS: true,
    },
  })
);

// view set
app.set("views", path.join(base, "views"));
app.set("view engine", "ejs");

// static set
app.use(express.static(path.join(base, "public"), { etag: true }));

// router
app.use(router);
// main
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
