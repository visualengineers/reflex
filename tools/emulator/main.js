const { app, BrowserWindow, powerSaveBlocker } = require("electron");
const path = require("path");
const url = require("url");

const powerSaveId = powerSaveBlocker.start('prevent-app-suspension');

app.commandLine.appendSwitch('disable-features', 'TabSuspender');

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      backgroundThrottling: false
    }
  });
  // load the dist folder from Angular
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, '/dist/browser/index.html'), // compiled version of our app
      protocol: "file:",
      slashes: true
    })
  );
  // The following is optional and will open the DevTools:
  // win.webContents.openDevTools()
  win.on("closed", () => {
    win = null;
  });
}
app.on("ready", createWindow);
// on macOS, closing the window doesn't quit the app
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }

  powerSaveBlocker.stop(powerSaveId);
});

powerSaveBlocker.stop(powerSaveId);
