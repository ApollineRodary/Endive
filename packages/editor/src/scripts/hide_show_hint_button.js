window.show_hb = function () {
  $(".hb").fadeIn(400);
};

window.hide_hb = function () {
  $(".hb").fadeOut(400);
};

window.in_hb = function () {
  $("#suggest_box").fadeIn(200);
};

window.out_hb = function () {
  $("#suggest_box").fadeOut(200);
};

window.set_suggestion = function (text) {
  $("#suggestion_text").replaceWith(
    "<div id=" + '"suggestion_text">' + text + "</div>",
  );
};

$("#hb_suggest").hover(in_hb, out_hb);
