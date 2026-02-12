const { app, BrowserWindow, session, powerSaveBlocker } = require('electron');
const url = require('url');
const path = require('path');

const powerSaveId = powerSaveBlocker.start('prevent-display-sleep');

app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
app.commandLine.appendSwitch('disable-features', 'TabSuspender');

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
      nodeIntegration: true,
      backgroundThrottling: false
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

  powerSaveBlocker.stop(powerSaveId);
});

process.on('uncaughtException', (err) => {
  console.log(err);
});


powerSaveBlocker.stop(powerSaveId);
