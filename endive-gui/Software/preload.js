window.addEventListener('DOMContentLoaded', () => {
  
})
const { contextBridge, ipcRenderer } = require('electron');

//Make the Electron-side functions available as Interface-side javascript
contextBridge.exposeInMainWorld('electronAPI', {
  fileOpen: () => ipcRenderer.invoke('dialog:fileOpen'),
  fileSaveAs: (content) => ipcRenderer.invoke('dialog:fileSaveAs', content),
  fileSave: (content, path) => ipcRenderer.invoke('dialog:fileSave', content, path)
})
