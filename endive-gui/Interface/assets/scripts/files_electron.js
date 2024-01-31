//Those three functions handle the communication with the Electron-side concerning all file-related matter.
//They are asynchronous, and use asynchronous functions (hence the "await" keyword)
//globalThis is a nice way to put variable in the global scope without polluting it.

async function save() {
  alert("Hmm");
}

async function save_as() {
  const content = globalThis.editor.state.doc.toString(); //Get the text from the editor

  const file_path = await window.electronAPI.fileSaveAs(content); //Send it to electron
  console.log("Saved successfully as" + file_path.toString()); //Get the name of the file it was saved it if successful
}

async function load() {
  const data = await window.electronAPI.fileOpen(); //Ask for a file opening

  const transaction = globalThis.editor.state.update({
    changes: { from: 0, to: globalThis.editor.state.doc.length, insert: data },
  }); // Put the received text in the editor
  const update = globalThis.editor.state.update(transaction);
  globalThis.editor.update([update]);
}
