window.onload = function(e){ 
    globalThis.editor.focus();
}

globalThis.menu_open = false;
function toggleMenu() {
    var menu = document.getElementById("menu");
    globalThis.menu_open = menu.classList.toggle('menu-open');
    if (globalThis.menu_open){
    	globalThis.editor.contentDOM.blur()
    }else{
    	globalThis.editor.focus()
    }
}
function setFocus(){

console.log("Heyo");
    globalThis.editor.focus()
}


document.onkeydown = function(evt) {
    evt = evt || window.event;
    var isEscape = false;
    if ("key" in evt) {
	isEscape = (evt.key === "Escape" || evt.key === "Esc");
    } else {
	isEscape = (evt.keyCode === 27);
    }
    if (isEscape) {
	toggleMenu();
    }
    if (globalThis.menu_open){
    if (evt.key === "s"){
    save();
    }
    if (evt.key === "l"){
    load();
    }
    if (evt.key === "a"){
    save_as();
    }
    }
};

