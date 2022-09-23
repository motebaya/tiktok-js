#!/usr/bin/node

const request = require("request")
const fs = require('fs')

const convertBytes = (bytes) => {
    if (!+bytes) return 0
    let size = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    let type = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${
        parseFloat(
            (bytes / Math.pow(1024, type)).toFixed(2)
        )
    } ${size[type]}`
}

const progress = (received, total) => {
    percentage = ((received * 100).toFixed(2) / total).toFixed(2)
    process.stdout.write("\r")
    process.stdout.write(
        `${percentage}% ${convertBytes(
            parseInt(received))} Total downloaded of size ${convertBytes(
                parseInt(total))}`
    )
}

const downloader = (url, filename) => {
    let outfile = fs.createWriteStream(
        filename
    )
    var total = 0
    var received = 0
    request.get(url)
    .on('response', function(data) {
        total = parseInt(data.headers["content-length"])
    })
    .on('data', function(chunk) {
        received += chunk.length
        progress(received, total)
    })
    .pipe(
        outfile
    )
}

module.exports = {downloader}
