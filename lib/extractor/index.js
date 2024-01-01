/**
 * @github.com/motebaya - 25.12.2023
 * file: index.js
 */
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse as parsePath, dirname } from "node:path";

/**
 * trying importing bulk files fastly.
 */
export const extractor = (
  await Promise.all(
    readdirSync(dirname(fileURLToPath(import.meta.url))).map(async (e, i) => {
      return new Promise(async (resolve) => {
        const _modules = {};
        const pinfo = parsePath(e);
        if (pinfo.name !== "index") {
          _modules[pinfo.name.toLocaleLowerCase()] = (
            await import(`./${pinfo.base}`)
          ).default;
        }
        resolve(_modules);
      });
    })
  )
).reduce((k, v) => {
  return { ...k, ...v };
}, {});
