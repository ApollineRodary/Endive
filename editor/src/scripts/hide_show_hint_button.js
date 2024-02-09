function show_hb() {
  $(".hb").fadeIn(400);
}

function hide_hb() {
  $(".hb").fadeOut(400);
}

function in_hb() {
  $("#suggest_box").fadeIn(200);
}

function out_hb() {
  $("#suggest_box").fadeOut(200);
}

function set_suggestion(text) {
  $("#suggestion_text").replaceWith(
    "<div id=" + '"suggestion_text">' + text + "</div>",
  );
}

$("#hb_suggest").hover(in_hb, out_hb);
