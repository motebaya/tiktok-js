#!/usr/bin/node
/*
just for learn about promise and asynchronous function
last update: new Date() => {
    Thu Sep 29 2022 21:52:44 GMT+0700 (Western Indonesia Time)
}
*/
const { get_data, get_video_id } = require("./lib/Tiktok.js");
const { download } = require("./lib/Downloader.js");
const { ArgumentParser, RawTextHelpFormatter } = require("argparse");

var [
    reset,
    green
] = [
    '\x1b[0m',
    '\x1b[32m'
]

const debug = (string) => {
    console.log(
        ` ${reset}[${green}${new Date().toString().split(/\s/)[4]}${reset}] ${string}`)
}

const banner = `\n${reset}     ┌┬┐┬┬┌─┌┬┐┌─┐┬┌─\n      │ │├┴┐ │ │ │├┴┐\n      ┴ ┴┴ ┴ ┴ └─┘┴ ┴\n Tiktok dl with aweme APi\n  \u00A9 github.com/motebaya\n`;

const main = async (url) => {
    const parser = new ArgumentParser({
        description: banner,
        formatter_class: RawTextHelpFormatter
    })
    parser.add_argument('-u', '--url', {type: 'str', metavar: '', help: 'url tiktok video'})
    parser.add_argument('-v', '--video', {action: 'store_true', help: 'get only video (without watermark)'})
    parser.add_argument('-m', '--music', {action: 'store_true', help: 'get only music video'})
    parser.add_argument('-a', '--avatar', {action: 'store_true', help: 'get only avatar image'})

    const group = parser.add_argument_group('additional', {
        description: 'info tools'
    })
    group.add_argument('-i', '--info', {action: 'store_true', help: 'show info'})
    const arg = parser.parse_args()
    if (arg.url){
        let video_id = await get_video_id(arg.url)
        await get_data(video_id).then(async(res) => {
            console.log(banner)
            debug(`author: ${res.author.name} (${res.author.username})`);
            debug(`description: ${res.desc}`)
            debug(`total views: ${res.stats.total_views}`);
            if (arg.video){
                var filename = `${res.desc.split("#")[0].trim()}.mp4`;
                if (filename.startsWith('#')) filename =`${res.media.match(/\/([a-z0-9]+)\//i)[1]}.mp4`;
                debug(`downloading video ... ${filename}`)
                await download(res.media, filename).then((resp) => {console.log()})
            }
            if (arg.music){
                let title = res.music.title
                debug(`downloading music file ... ${title}.mp3`)
                await download(res.music.url, `${title}.mp3`).then((resp) => {console.log()})
                debug(`downloading music cover.. ${title}.jpg`)
                await download(res.music.cover, `${title}.jpg`).then((resp) => {console.log()})
            }
            if (arg.avatar){
                let filename = `${res.author.username}.jpg`
                debug(`downloading avatar images.. ${filename}`)
                await download(res.author.avatar, filename).then(() => {console.log()})

            }
            // console.log(res)
        })
        // console.log(video_id)
    } else {
        parser.print_help()
    }
}

main().catch(console.error)
