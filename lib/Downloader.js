#!/usr/bin/node
/*
-- downloader module 
*/
const request = require("request")
const fs = require('fs')

const convert_size = (bytes) => {
    return new Promise((resolve, reject) => {
        if (!+bytes) resolve(0);
        let size = ['B', 'KB', 'MB', 'GB']
        let type = Math.floor(Math.log(bytes) / Math.log(1024))
        resolve(`${parseFloat((bytes / Math.pow(1024, type)).toFixed(2))} ${size[type]}`)
    })
}

const progress = (received, total) => {
    return new Promise(async (resolve, reject) => {
        percentage = ((received * 100).toFixed(2) / total).toFixed(2)
        let size_received = await convert_size(parseInt(received))
        let size_total = await convert_size(parseInt(total))
        process.stdout.write("\r")
        process.stdout.write(
            `${percentage}% ${size_received} Total downloaded of size ${size_total}`
        )
        resolve()
    })
}

function download(url, fname){
    return new Promise((resolve, reject) => {
        var received = 0
        var total = 0
        let stream = fs.createWriteStream(fname)
        request.get(url)
            .on('response', async resp => {
                var sizes = parseInt(resp.headers['content-length'])
                total = sizes
            }).on('data', async (chunk) => {
                received += chunk.length
                await progress(received, total)
            }).pipe(stream)
        stream.on('finish', () => {
            resolve()
        })
    })
}


module.exports = {download}
