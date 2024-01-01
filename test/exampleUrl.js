import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

export const exampleUrl = {
  videoMobileUrl: "https://vt.tiktok.com/ZSNtQrjFb/",
  videoWebUrl: "https://www.tiktok.com/@komifish/video/7262073386573106437", // video type
  imageMobileUrl: "https://vt.tiktok.com/ZSNtU9qCK/", // image slider (mobile url)
  imageWebUrl: "https://www.tiktok.com/@ibnu.senku/video/7285940080445885701", // images slider url
  imageWebUrl1: "https://www.tiktok.com/@riixgi/video/7309754777557142789",
};

export const deleteCache = () => {
  const cachePath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../tiktok-downloader-output"
  );
  if (fs.existsSync(cachePath)) {
    fs.rmSync(cachePath, { recursive: true, force: true });
  }
};
