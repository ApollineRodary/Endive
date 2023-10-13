window.addEventListener('DOMContentLoaded', () => {
  
})
const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('electronAPI', {
  fileOpen: () => ipcRenderer.invoke('dialog:fileOpen'),
  fileSaveAs: (content) => ipcRenderer.invoke('dialog:fileSaveAs', content),
  fileSave: (content, path) => ipcRenderer.invoke('dialog:fileSave', content, path)
})
