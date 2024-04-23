/**
 * @github.com/motebaya - 2024.04.23
 * file: ratelimiter.js
 *
 * idk who, but someone spam my vercel every sec lol.
 * even i was provide how to deploy it self, ah yes.. they'al just lazy ppl.
 * reff: https://www.npmjs.com/package/express-rate-limit
 */

import rateLimit from "express-rate-limit";
import Utils from "../lib/Util.js";

export const rateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 1,
  keyGenerator: function (req) {
    return req.headers["x-real-ip"];
  },
  handler: async (req, res, next) => {
    res.status(429).json({
      status: "failed",
      data: encodeURIComponent(
        await Utils.renderEjs({
          title: "tiktok-js - Error (limit exceded) ",
          result: {
            message: "Limit api demo exceeded",
            errors: JSON.stringify({
              message:
                "rate limit api for 5x/24 hour has exceeded! you can deploy it self on vercel by following: https://github.com/motebaya/tiktok-js?tab=readme-ov-file#setup-web-server",
            }),
          },
        })
      ),
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
