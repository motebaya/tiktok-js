## Tiktok-JS

<div align="center">
Tiktok downloader tool

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

NodeJS CLI and web server tool for downloading TikTok media such as images slideshow, music, and videos (without watermark) using scraping methods.

### Features:

- Available for CLI & web server.
- Asynchronous & concurrency download.
- More than 10 server are available for downloading .
- Support media music, avatar, cover music, thumbnail and etc.

### Features list:

the list feaures media supported

| Name            | Host                | Images  | Video   | Music   | Img[slideshow] |
| --------------- | ------------------- | ------- | ------- | ------- | -------------- |
| Aweme           | api-h2.tiktokv.com  | &check; | &check; | &check; |                |
| Musicaldown     | musicaldown.com     | &check; | &check; | &check; | &check;        |
| Savetik         | savetik.co          | &check; | &check; | &check; | &check;        |
| Snaptik         | snaptik.app         | &check; | &check; | &check; | &check;        |
| SnaptikPro      | snaptik.pro         |         | &check; | &check; |                |
| Ssstik          | ssstik.io           | &check; | &check; | &check; | &check;        |
| Tikcdn          | tikcdn.app          | &check; | &check; | &check; |                |
| Tikmate         | tikmate.online      | &check; | &check; | &check; | &check;        |
| Tiktokdownloadr | tiktokdownloadr.com |         | &check; | &check; |                |
| Tikwm           | tikwm.com           | &check; | &check; | &check; |                |
| Ttdownloader    | ttdownloader.com    |         | &check; | &check; |                |

> [!important]
> Some servers support rendering image slide show to video, but sometimes it may not work due to issues with the server itself (which are beyond my control). the same applies to other potential issues.

### Install:

```bash
git clone https://github.com/motebaya/tiktokJs-downloader
cd tiktok-js
npm i
```

### Usage (CLI):

```bash
 $ node cli
 usage: cli.js [-h] [-u] [-s] [-t] [-S] [-d] [-l] [-V]

	TIktok CLI downloader
 © Copyright: @github.com/motebaya - 2023

optional arguments:
  -h, --help      show this help message and exit
  -u , --url      tiktok video url
  -s , --server   choose server list: [aweme, musicaldown, savetik, snaptik, snaptikpro, ssstik, tikcdn, tikmate, tiktokdownloadr, tikwm, ttdownloader]
  -t , --type     choose existing media type: [image, video, music]

additional:
  -S , --search   search username/account using puppeteer by suplied query string. min:1, max:100
  -d , --dump     dump bulk user videos using puppeteer by suplied username. min: 35, max: 1000
  -l , --limit    limit arg number
  -V, --verbose   debug mode on

```

- `-u`,` --url`: tiktok video url.
- `-s`, `--server`: sever method.
- `-t`, `--type`: media type to download.
- `-V`, `--verbose`: enable debug mode.
- `-S`, `--search`: dump tiktok username by search query (puppeteer)
- `-d`, `--dump`: dump video id from tiktok user feeds (puppeteer)
- `-l`, `--limit`: limit dump for user search and userfeed.

> [!note]
> downloaded media in CLI will be saved in current directory with name `tiktok-downloader-output`
> see in [downloader.js](lib/downloader.js#68)

### Setup Web Server:

- run server on local:

```bash
 ❯ npm run start/dev

> tiktok-js@2.1.1 start
> node ./index.js

App listening on port 3000
```

### Demo:

- CLI:
  <details>
  <summary>
    downloading videos with images slider type.
  </summary>

  ![demo](assets/cli-demo.svg)

  </details>

  <details>
  <summary>
    downloading video with debug on.
  </summary>

  ![demo2](assets/cli-demo-2.svg)

  </details>

- Web:
  https://vecel.com

## License

This project is licensed under the [MIT License](LICENSE).
