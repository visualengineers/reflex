# VibroTactileLayers

Project for a study in context of layer-based interaction combined with vibrotactile feedback.

## Run App

### Development

* start logging / data service with `npm run debug-server` (when debugging is necessary) or `npm run start-server` (necessary for saving data / logging)
* server runs at `http://localhost:4301`
* Test request can be found in `tools/Insomnia_Requests.json` for testing the REST_APPI with **Insomnia**
* start app with `npm start`
* App runs at `http://localhost:4201`

### Electron-App

* just start electron app, server starts in background

## Keyboard Shortcuts

| Key         | Description                                                                    |
| ----------- | ------------------------------------------------------------------------------ |
| `d`         | Toggle `Debug Mode`                                                            |
| `g`         | Toggle `Generate UI` (only on Start Screen)                                    |
| `ALT` + `1` | Advance to state `Initialization` (only available when `Debug Mode` is active) |
| `ALT` + `2` | Advance to state `Startup` (only available when `Debug Mode` is active)        |
| `ALT` + `3` | Advance to state `introduction` (only available when `Debug Mode` is active)   |
| `ALT` + `4` | Advance to state `Training` (only available when `Debug Mode` is active)       |
| `ALT` + `5` | Advance to state `Experiment` (only available when `Debug Mode` is active)     |
| `ALT` + `6` | Advance to state `Finish` (only available when `Debug Mode` is active)         |

### Electron

| Key                    | Description              |
| ---------------------- | ------------------------ |
| `STRG` + `Shift` + `I` | Toggle `Developer Tools` |
| `STRG` + `M`           | Minimize App             |
| `STRG` + `F5`          | Force Reload             |
