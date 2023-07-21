const { app, BrowserWindow, session } = require('electron');
const url = require('url');
const path = require('path');

app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

let appWindow;

function initWindow() {

  session.defaultSession.clearCache();
  session.defaultSession.clearStorageData();

  appWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    fullscreen: true,
    autoHideMenuBar: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // Electron Build Path
  appWindow.loadURL('https://localhost:5001');

  // Initialize the DevTools.
  // appWindow.webContents.openDevTools();

  appWindow.on('closed', () => {
    appWindow = null;
  });
}

app.on('ready', initWindow);

// Close when all windows are closed.
app.on('window-all-closed', () => {

  // On macOS specific close process
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (err) => {
  console.log(err);
});
