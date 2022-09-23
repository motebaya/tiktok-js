#!/usr/bin/node

const { get_data, get_video_id } = require("./lib/Tiktok.js")
const { downloader } = require("./lib/Downloader.js")
const { ArgumentParser } = require("argparse")

async function Main(config, video_url){
    await get_data(video_url)
    .then((res) => {
        console.log(
            `
 [@] author: ${res.author.name} (${res.author.username})
 [@] biography: ${res.author.biography}
 [@] desc: ${res.desc}
 [@] views: ${res.stats.total_views}
 [@] config: ${config.join(", ")}
            `
        )
        if (config.includes('a')){
            console.log(
                ` [log] downlaoding Avatar..`
            )
            downloader(
                res.author.avatar, `${res.author.name}-${res.author.username}.png`
            )
        }

        if (config.includes('m')){
            console.log(" [log] downloading Music..")
            downloader(
                res.music.url, `${res.music.title}.mp3`
            )
            console.log(" [log] downlaoding music cover..")
            downloader(
                res.music.cover, `${res.music.title}.jpg`
            )
        }

        if (config.includes('v')){
            console.log(" [log] downloading video..")
            filename = res.desc.split("#")[0].trim()
            if (filename.startsWith('#')){
                filename = res.media.match(/\/([a-z0-9]+)\//i)[1]
            }
            downloader(
                res.media, `${filename}.mp4`
            )
        }
        // console.log(
        //     " [ok] done"
        // )
    }).catch((err) => {
        console.error(err)
    })
}

const _parse = new ArgumentParser({
    description: "A simple tiktok downloader\n @ motebaya 2022 "
})

_parse.add_argument("-u", "--url", {
    metavar: '',
    type: 'str',
    help: 'url tiktok video'
})

_parse.add_argument("-a", "--avatar", {
    action: 'store_true',
    help: 'only get avatar'
})

_parse.add_argument("-m", "--music", {
    action: 'store_true',
    help: 'url get music'
})

_parse.add_argument("-v", "--video", {
    action: 'store_true',
    help: 'only get tiktok video (without watermark)'
})

_parse.add_argument("-g", "--grab", {
    action: 'store_true',
    help: 'download all media, include music, video .etc'
})

_more = _parse.add_argument_group("additional", {
    description: "if u dont know to usage, just use this command"
})
_more.add_argument("-e", "--example", {
    action: 'store_true',
    help: 'show example for usage '
})

arg = _parse.parse_args()
if (arg.url){
    let config = []
    if (arg.avatar) config.push('a')
    if (arg.music) config.push('m')
    if (arg.video) config.push('v')
    if (!config.length) config.push(...['a','m', 'v'])
    get_video_id(arg.url).then((video_id) => {
        Main(config, video_id)
    }).catch((err) => {
        throw Error(err)
    })
} else {
    _parse.print_help()
}

// console.log(arg)
// console.log(downloader)
// downloader("https://images3.alphacoders.com/127/1273326.jpg", "rebeca.png")
