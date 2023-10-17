/**
 * @github.com/motebaya - © 2023-10
 * file: function.js
 * (jquery content handle)
 */

const setTheme = (theme) => {
  console.log(`changed theme to: ${theme}`);
  const toggle = $("#themes").find("i");
  if (toggle.hasClass("bi-brightness-high-fill") && theme === "light") {
    toggle
      .removeClass("bi-brightness-high-fill")
      .addClass("bi-moon-stars-fill");
  } else {
    toggle
      .removeClass("bi-moon-stars-fill")
      .addClass("bi-brightness-high-fill");
  }
  $("html").attr("data-bs-theme", theme);
  localStorage.setItem("theme", theme);
};

const getTheme = () => {
  let storedTheme = localStorage.getItem("theme");
  if (storedTheme) {
    return storedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const svgCheck = () => {
  const svg = $(".svg-crying");
  const currentTheme = getTheme();
  const currentFilled = svg.data("filled");
  if (currentFilled === currentTheme) {
    svg.attr(
      "src",
      currentTheme === "dark"
        ? svg.attr("src").replace(/-dark/g, "")
        : svg.attr("src").replace(/\.svg/g, "-dark.svg")
    );
    svg.data("filled", currentFilled === "dark" ? "light" : "dark");
  }
};

$(window).on("load", () => {
  setTheme(getTheme());
  svgCheck();
});

$(document).ready(function () {
  /**
   * cache check, if exist then load it.
   */
  if ($("#content").css("display") === "none") {
    const cachedResult = localStorage.getItem("cachedResult");
    if (cachedResult) {
      $("#content").html(decodeURIComponent(cachedResult)).fadeIn("slow");
      $('div[class="toast-body"]').html("loaded cache from before result..");
      $(".liveToast").toast("show");
    }
  }

  // form handle
  $('form[method="POST"]').on("submit", function (e) {
    e.preventDefault();
    if ($('select[name="server"]').val() === "default") {
      $('div[class="toast-body"]').html("please fill form correctly!");
      $(".liveToast").toast("show");
    } else {
      if ($("#content").css("display") !== "none") {
        $("#content").fadeOut("slow");
      }
      const button = $("#btn-go");
      button.prop("disabled", true);
      button.html(
        `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span role="status"> Processing...</span>`
      );

      // ajax
      const formdata = $(this).serialize();
      console.log(formdata);
      $.ajax({
        url: "/api/postVideo",
        data: formdata,
        method: "POST",
        dataType: "json",
      })
        .done((res) => {
          button.html(`<i class="bi-send me-2"></i>Go`);
          button.prop("disabled", false);
          $('form[method="POST"]')[0].reset();
          /**
           * when you not deliberate refresh page before download,
           * so, before result will be loaded from storage cache (if not empty) if you refreshed page.
           */
          localStorage.setItem("cachedResult", res.result);
          $("#content").html(decodeURIComponent(res.result)).fadeIn("slow");
        })
        .fail((err) => {
          console.log(err);
        });
    }
  });

  // theme
  $("#themes").on("click", () => {
    setTheme(getTheme() === "dark" ? "light" : "dark");
    svgCheck();
  });

  // back to top
  $(window).on("scroll", function () {
    if ($(this).scrollTop() > 300) {
      $(".back-to-top").fadeIn();
    } else {
      $(".back-to-top").fadeOut();
    }
  });

  // placeholder
  const placeholder = [
    "https://www.tiktok.com/@usera123/video/72620733865738755467",
    "https://vt.tiktok.com/ZSR9juhf87/",
  ];
  let index = 0;
  setInterval(() => {
    $("input[id='video_url']").attr("placeholder", placeholder[index]);
    index = (index + 1) % placeholder.length;
  }, 1500);
});
