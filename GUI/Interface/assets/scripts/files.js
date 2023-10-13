
async function save(){
alert("Hmm");
}

async function save_as(){
const content = globalThis.editor.state.doc.toString()
const file_path = await window.electronAPI.fileSaveAs(content);
console.log("Saved successfully as"+file_path.toString());
}

async function load(){
const data = await window.electronAPI.fileOpen();
  const transaction = globalThis.editor.state.update({changes: {from: 0, to: globalThis.editor.state.doc.length, insert: data}})
  const update = globalThis.editor.state.update(transaction);
    globalThis.editor.update([update]);
}



