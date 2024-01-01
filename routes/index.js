/**
 * @github.com/motebaya - © 2023-10
 * file: api/index.js
 */
import express from "express";
const router = express.Router();
import routerAPI from "./api.js";
import Utils from "../lib/Util.js";
import { extractor } from "../lib/extractor/index.js";

// index home
router.get("/", (req, res) => {
  res.status(200).render("index", {
    title: "Home",
    serverList: extractor,
    Utils: Utils,
  });
});

router.get("/about", (req, res) => {
  res.status(200).render("about", { title: "About - TiktokDL" });
});

/**
 * set index visit /api/<api routes>.
 * e.g: /api/tools -> api.js (/tools)
 *    /api -> api.js (/)
 */
router.use("/api", routerAPI);

// 404 page
router.use("*", (req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

export default router;
