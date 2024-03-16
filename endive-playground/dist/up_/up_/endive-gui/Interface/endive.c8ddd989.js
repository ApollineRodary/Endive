window.onload = function(e) {
    globalThis.editor.focus(); //Put the cursor in the editor by default
};
globalThis.menu_open = false; //Keep track of the state of the menu
function toggleMenu() {
    //show/hide the menu
    var menu = document.getElementById("menu");
    globalThis.menu_open = menu.classList.toggle("menu-open");
    if (globalThis.menu_open) globalThis.editor.contentDOM.blur();
    else globalThis.editor.focus(); //get back to the editor if closing
}
document.onkeydown = function(evt) {
    //Handle key events,
    //Keep in mind that this is triggered even when typing in the editor.
    evt = evt || window.event;
    var isEscape = false;
    if ("key" in evt) //Don't know why but it appears that is how to detect Esc
    isEscape = evt.key === "Escape" || evt.key === "Esc";
    else isEscape = evt.keyCode === 27;
    if (isEscape) toggleMenu();
    if (globalThis.menu_open) {
        //Allows for quickly selecting menu option
        if (evt.key === "s") save();
        if (evt.key === "l") load();
    /*if (evt.key === "a"){
    save_as();
    }*/ }
};

//# sourceMappingURL=endive.c8ddd989.js.map
