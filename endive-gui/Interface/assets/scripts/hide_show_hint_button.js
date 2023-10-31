function show_hb(){
   $(".hb").fadeIn(400);
}

function hide_hb(){
   $(".hb").fadeOut(400);
}

function in_hb(){
	$('#suggest_box').fadeIn(200);
}

function out_hb(){
	$('#suggest_box').fadeOut(200);
}

$("#hb_suggest").hover(in_hb,out_hb)
