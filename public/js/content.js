/**
 * @github.com/motebaya
 * i didn't think, the rendered html should bring js code separated,
 * or if not, the element which connect with jquery doesn't work at all.
 */
$(document).ready(function () {
  $(".toast-avatar").on("click", () => {
    $('div[class="toast-body"]').html(
      "no avatar for this user, you can choose other method for download avatar"
    );
    $(".liveToast").toast("show");
  });
  $('a[data-toggle="popover"]').popover({
    html: true,
    content: function () {
      if ($('[data-toggle="popover"]').data("error") === true) {
        return `<p class="mb-1 fw-medium">&#9888; Something wen't wrong when server trying process video url, try other method or submit <a href="#">issue<a/> if still happened!</p><p class="mb-1 fw-medium">or check again your url video, make sure url is correct and video is public (everyone can see it)</p>`;
      } else {
        return `<p class="fw-medium">&#9733; Hei, You Can Click image <span class="fw-bold">thumbnail, music or avatar cover</span> to download it!</p>`;
      }
    },
    title: "Tips",
    placement: "right",
  });
});
