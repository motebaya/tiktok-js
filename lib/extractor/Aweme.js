/**
 * @github.com/motebaya - © 2023-10
 * file: aweme.js
 */
import Init from "../Init.js";

class Aweme extends Init {
  constructor(verbose) {
    super(verbose);
  }

  /**
   * short bcs url_list have 2 type url: (webp & jpeg).
   * @params array url: url list
   * @return object json
   *
   */
  short_image_type(list) {
    return list.reduce((res, url) => {
      var ext = new RegExp(/(\.jpeg|\.jpg|\.png|\.webp)/).exec(url);
      if (ext !== null) {
        res[
          ["jpeg", "jpg", "png"].includes(ext[0].slice(1)) ? "url" : "thumbnail"
        ] = url;
      }
      return res;
    }, {});
  }

  /**
   * extract video data with tiktok aweme api
   * @params string videoid: tiktok video id
   * @return object json
   *
   */
  async get_video_data(videoid) {
    this.logger.debug(`Extracting video from ID: ${videoid}`);
    return new Promise(async (resolve, reject) => {
      if (videoid !== undefined && new RegExp(/^[0-9]+$/).test(videoid)) {
        let response = await this.client.get(
          "https://api-h2.tiktokv.com/aweme/v1/feed/",
          {
            params: {
              version_code: "2613",
              aweme_id: videoid,
              device_type: "Pixel%204",
            },
            responseType: "json",
          }
        );
        let data = response.data;
        if (data.status_code === 0) {
          let selected = data.aweme_list[0];
          let author = selected.author;
          let music = selected.music;
          let result = {
            status: true,
            description: selected.desc,
            video_id: selected.aweme_id,
            author: {
              avatar: author.avatar_medium.url_list[1],
              name: author.nickname,
              bio: author.signature,
              username: author.unique_id,
            },
            music: {
              title: music.title,
              author: music.author,
              cover: music.cover_hd.url_list[1],
              url: music.play_url.url_list[0],
            },
            stats: {
              total_share: selected.statistics.share_count,
              total_download: selected.statistics.download_count,
              total_views: selected.statistics.play_count,
              total_comment: selected.statistics.comment_count,
            },
          };

          if (Object.keys(selected).includes("image_post_info")) {
            this.logger.debug(
              `${selected.image_post_info.images.length} Images Collected!`
            );
            result.isImage = true;
            result.images = selected.image_post_info.images.map((img) => {
              return this.short_image_type(img.display_image.url_list);
            });
          } else {
            let video = selected.video;
            result.isImage = false;
            result.videos = video.play_addr.url_list;
            result.thumbnail = video.cover.url_list[1];
            //this.short_image_type(video.cover.url_list);
          }
          resolve(result);
        } else {
          this.logger.error(`failed extracting video data from: ${videoid}`);
          resolve({
            status: false,
            message: "failed get video data ",
          });
        }
      } else {
        resolve({
          status: false,
          message: `invalid suplied video id!, ${videoid}`,
        });
      }
    });
  }
}

export default Aweme;
