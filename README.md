## Tiktok JS

<div align="center">
NodeJS CLI/server tool for download tiktok videos without watermark. made with

[![nodejs](https://img.shields.io/badge/nodeJs-18.18.2-green?logo=node.js&logoColor=green)](https://www.php.net/releases/#7.4.33)
[![tiktok](https://img.shields.io/badge/tiktok-downloader-purple?logo=tiktok&logoColor=white)](https://github.com/motebaya/tiktok-js)
[![express](https://img.shields.io/badge/ExpresJs-4.18.2-green?logo=Express&logoColor=white)](https://expressjs.com)
[![bootstrap](https://img.shields.io/badge/Boostrap-5.3-purple?logo=Bootstrap&logoColor=white)](https://getbootstrap.com/docs/5.3/getting-started/introduction/)
[![express](https://img.shields.io/badge/Jquery-3.7.1-blue?logo=Jquery&logoColor=white)](https://expressjs.com)
[![Scraper](https://img.shields.io/badge/web-scrapper-blue?logo=strapi&logoColor=blue)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg?logo=github)](https://opensource.org/licenses/MIT)
[![total stars](https://img.shields.io/github/stars/motebaya/tiktok-js.svg?style=social)](https://github.com/motebaya/tiktok-js/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/motebaya/tiktok-js.svg?style=social)](https://github.com/motebaya/tiktok-js/network/members)

</div>

### Features:

- Available for CLI & server.
- Download images, videos, & music by suplied tiktok url.
- Asynchronous & concurrency download.
- Multiple method, e.g: extenal video downloader site.

### Setup:

```bash
git clone https://github.com/motebaya/tiktok-js
cd tiktok-js
npm i
```

### Usage (CLI):

```bash
 $ node cli
usage: cli [-h] [-u] [-s] [-t] [-V]

 TIktok CLI downloader
 © Copyright: @github.com/motebaya

optional arguments:
  -h, --help      show this help message and exit
  -u , --url      tiktok video url
  -s , --server   choose server list: [snaptik, tikmate, aweme]
  -t , --type     choose existing media type: [image, video, music]

additional:
  -V, --verbose   debug mode on
```

- `-u/--url`: tiktok video url.
- `-s/--server`: sever method to download.
- `-t/--type`: media type to download.
- `-V/--verbose`: enable debug mode.

### Setup Web Server:

**Note:** make sure you've rename `.env-example` to `.env`

- production:

```bash
 npm run start
```

- development:

```bash
npm run dev
```

### Example (demo):

- image slider videos (mobile features) with debug on.
  ![demo](src/cli-demo.svg)
- video with debug on.
  ![demo2](src/cli-demo-2.svg)
- demo site
  `comming soon`

## License

This project is licensed under the [MIT License](LICENSE).
