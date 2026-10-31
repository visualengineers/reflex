# Electron builds and startup checks

Use Node.js 22 or newer and install npm dependencies at the repository root with `npm ci`. TrackingServer also
requires the .NET SDK selected by `global.json`; `dotnet --version` must succeed
from the repository root. Its ElectronNET CLI is pinned in `.config/dotnet-tools.json`
and restored automatically by the build. No global Electron or electronize installation
is required. Angular package versions are shared and are not changed by packaging.

Run these commands from the repository root, replacing `<app>` with `emulator` or `server`:

| Command | Target |
| --- | --- |
| `npm run build:<app>:electron-win` | Windows x64 |
| `npm run build:<app>:electron-osx` | macOS x64 |
| `npm run build:<app>:electron-osx-arm64` | macOS ARM64 |
| `npm run build:<app>:electron-linux` | Linux x64 |
| `npm run build:<app>:electron-linux-arm64` | Linux ARM64 |

Build macOS packages on macOS. For startup testing, build on the target OS and
architecture. Append `-- --dir` to generate only the unpacked application, for example:

```sh
npm run build:emulator:electron-osx-arm64 -- --dir
npm run smoke:electron -- emulator
npm run build:server:electron-osx-arm64 -- --dir
npm run smoke:electron -- server
```

On Linux, run the smoke command under `xvfb-run -a` if no graphical display is available.
Emulator output is in `tools/emulator/release`; TrackingServer output is in
`tools/ReFlex.TrackingServer/bin/Desktop`. The smoke test reads `smoke-target.json`
from that output directory, starts the packaged executable, checks that Angular
has rendered its main page, and checks the TrackingServer version API. It fails
on early process exit, renderer exceptions or a startup timeout. It terminates
the app and its backend after the check. Startup logs and a screenshot are written
to `test/artifacts/electron/<app>`.

The `Electron startup smoke tests` GitHub workflow runs both apps on all five
native OS/architecture combinations on pull requests and pushes to `main`.
PR builds are unsigned, never publish installers and require no signing secrets.
They use unpacked applications so the check exercises the shipped files, including
the self-contained .NET backend, without installing a system-wide application.

The Emulator renderer is bundled by Angular. Packaging copies only the bundled
renderer and Electron entry point into an isolated `.electron-app` directory;
it never installs or prunes dependencies in the npm workspace. TrackingServer
publishes shared types, components and the SPA before Electron.NET packaging.
Its browser files are served from `ClientApp/dist/browser`; local Electron HTTP
does not require an ASP.NET development HTTPS certificate. The existing default
Azure Kinect module is enabled only on Windows x64; other platforms do not load
that Windows-only module. Set the MSBuild/environment property
`EnableDefaultSensors=false` to opt out of the default hardware module.
