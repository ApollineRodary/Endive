const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("fs");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  //win.removeMenu(); //Disable that to show menu used for debug of javascript (~developer tools)

  //Keep in mind that if the structure changes in editor we should update this link
  win.loadFile("../editor/dist/browser/index.html");
};

//Make Electron-side functions available as Interface-side javascript
app.whenReady().then(() => {
  ipcMain.handle("dialog:fileOpen", handleFileOpen);
  ipcMain.handle("dialog:fileSaveAs", handleFileSaveAs);
  ipcMain.handle("dialog:fileSave", handleFileSave);
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

//The three following functions handle the file manipulation

async function handleFileOpen(event) {
  const { canceled, filePaths } = await dialog.showOpenDialog();
  if (!canceled) {
    let data = fs.readFileSync(filePaths[0], "utf-8");
    return data;
  }
}
async function handleFileSaveAs(event, content) {
  const { canceled, filePath } = await dialog.showSaveDialog();
  console.log(content);
  console.log(filePath);
  if (!canceled) {
    fs.writeFileSync(filePath, content, "utf-8");
    return filePath;
  } else {
    console.log("Erroooor");
  }
}
async function handleFileSave(event, path, content) {
  console.log("Not functionning yet");
}
