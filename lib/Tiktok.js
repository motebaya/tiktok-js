#!/usr/bin/node

const axios = require("axios")
const headers = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 11; Infinix X6810) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Mobile Safari/537.36"
}
const patternId = new RegExp(/(?:https\:\/\/www\.tiktok\.com\/@[^\"]*?\/video\/(?<id>[0-9]*))/)

const get_video_id = async (url) => {
    return await new Promise((resolve, reject) => {
        if (!url.includes("@")){
            axios.get(url, {
                headers: headers
            }).then((res) => {
                let video_id = patternId.exec(res.data)
                if (video_id !== null){
                    resolve(video_id[0])
                } else {
                    reject(video_id)
                }
            }).catch((err) => {
                reject(err)
            })
        } else {
            resolve(
                patternId.exec(
                    url
                )[0]
            )
        }
    })
}

const get_data = async (video_url) => {
    return new Promise((resolve, reject) => {
        if (patternId.test(video_url)){
            axios.get([...`/`+([]+[]+[][[]])[((+!+[])+(+!+[]))]+([]+[]+[][[]])[(+!+[]+((+!+[])+(+!+[])))]+([]+[]+[][[]])[(+!+[]+((+!+[])+(+!+[])))]+(![]+[])[(+[])]+`/`+`1`+([]+[]+([]).constructor)[(+[+!+[]+[+[]+[+[]]]])/((+!+[])+(+!+[]))/((+!+[])+(+!+[]))-(+!+[])]+`/`+([]+[]+[][[]])[(+!+[]+((+!+[])+(+!+[])))]+(typeof +[])[((+!+[])+(+!+[]))]+([]+[]+[][[]])[(+!+[]+((+!+[])+(+!+[])))]+'w'+(![]+[])[(+!+[])]+`/`+(typeof +[])[((+!+[])+(+!+[]))]+(typeof ![])[(+!+[])]+(typeof [])[((+!+[])+(+!+[]))*((+!+[])+(+!+[]))]+`.`+([]+[]+([]).constructor)[(+[+!+[]+[+[]+[+[]]]])/((+!+[])+(+!+[]))/((+!+[])+(+!+[]))-(+!+[])]+'k'+(typeof ![])[(+!+[])]+(!![]+[])[(+[])]+'k'+([]+[]+[][[]])[(+[+!+[]+[+[]]])/((+!+[])+(+!+[]))]+(!![]+[])[(+[])]+`.`+`2`+'h'+`-`+([]+[]+[][[]])[(+[+!+[]+[+[]]])/((+!+[])+(+!+[]))]+(RegExp().constructor.name)[((+!+[])+(+!+[]))+(+!+[]+((+!+[])+(+!+[])))]+(![]+[])[(+!+[])]+`/`+`/`+`:`+(![]+[])[(+!+[]+((+!+[])+(+!+[])))]+(RegExp().constructor.name)[((+!+[])+(+!+[]))+(+!+[]+((+!+[])+(+!+[])))]+(!![]+[])[(+[])]+(!![]+[])[(+[])]+'h'].reverse().join(""), {
                headers: headers,
                params: {
                    version_code: '2613',
                    aweme_id: patternId.exec(
                        video_url
                    ).groups.id,
                    device_type: 'Pixel%204'
                }
            }).then((res) => {
                data = res.data.aweme_list[0]
                if (data.hasOwnProperty("image_post_info")){
                    var video_type = "album"
                    var media = []
                    data["image_post_info"]["images"][0].forEach((value) => {
                        media.push(value["display_image"]["url_list"][0])
                    })
                } else {
                    var video_type = "video"
                    var media = data["video"]["play_addr"]["url_list"][0]
                }
                resolve({
                    status: true,
                    author: {
                        name: data.author.nickname,
                        username: data.author.unique_id,
                        biography: data.author.signature,
                        avatar: data.author.avatar_medium.url_list[0]
                    },
                    stats: {
                        total_share: data.statistics.share_count,
                        total_download: data.statistics.download_count,
                        total_views: data.statistics.play_count,
                        total_comment: data.statistics.comment_count,
                    },
                    music: {
                        author: data.music.author,
                        title: data.music.title,
                        url: data.music.play_url.uri,
                        cover: data.music.cover_large.url_list[0]

                    },
                    media: media,
                    desc: data.desc
                })
            }).catch((err) => {
                reject(
                    err
                )
            })
        } else {
            reject(
                false
            )
        }
    })
}

module.exports = { get_data, get_video_id }
// get_data("https://www.tiktok.com/@dgzr079/video/7103529679029636378")
// .then((data) => {
//     console.log(JSON.stringify(data, null, 2))
// }).catch((err) => {
//     console.error(err)
// })
// let ids = 
// get_video_id("https://vt.tiktok.com/ZSR9jCno6/")
// get_video_id("https://www.tiktok.com/@dgzr079/video/7103529679029636378")
// .then((data) => {
//     console.log(data)
// }).catch((err) => {
//     console.error("")
// })

// console.log(ids)
