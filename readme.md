# ReFlex

Software Development SDK for __Elastic Displays__ as open source mono repo

Complete Documentation as github pages available at [https://visual-engineers.org/reflex/](https://visual-engineers.org/reflex/)

* .NET Core library as framework for different depth sensors, calibration, depth image filtering and reconstruction of interactions
* APS.NET Core / Angular server application as frontend for library
* can be packaged as electron app for desktop
* Example client applications for Plain HTML, Angular, React, Vue.js, Plugins for Unity, Unreal Engine 5
* Emulator as Development Tool
* Example Applications

<!-- omit in toc -->
## Table of contents

1. [Build status](#build-status)
2. [Repository structure](#repository-structure)
3. [External Dependencies](#external-dependencies)
4. [use shared code](#use-shared-code)
5. [NPM commands](#npm-commands)
6. [Python gRPC Processing service](#python-grpc-processing-service)
7. [Known issues / Troubleshooting](#known-issues-troubleshooting)

## Build status

|     |     |
| --- | --- |
| ReFlex Library (.NET) | [![Library:Test](https://github.com/visualengineers/reflex/actions/workflows/library-test.yml/badge.svg#build-status)](https://github.com/visualengineers/reflex/actions/workflows/library-test.yml) |
| Shared Types (TypeScript) | [![Shared Types:Build](https://github.com/visualengineers/reflex/actions/workflows/shared-build.yml/badge.svg#build-status)](https://github.com/visualengineers/reflex/actions/workflows/shared-build.yml) |
| Shared Components (Angular) | [![Shared Components:Build](https://github.com/visualengineers/reflex/actions/workflows/shared-components-build.yml/badge.svg#build-status)](https://github.com/visualengineers/reflex/actions/workflows/shared-cp,ponents-build.yml) |
| Tools/TrackingServer | [![Server:Build](https://github.com/visualengineers/reflex/actions/workflows/server-build.yml/badge.svg#build-status)](https://github.com/visualengineers/reflex/actions/workflows/server-build.yml) |
|  | [![Server:Lint](https://github.com/visualengineers/reflex/actions/workflows/server-lint.yml/badge.svg#build-status)](https://github.com/visualengineers/reflex/actions/workflows/server-lint.yml) |
|  | [![Server:Test](https://github.com/visualengineers/reflex/actions/workflows/server-test.yml/badge.svg#build-status)](https://github.com/visualengineers/reflex/actions/workflows/server-test.yml) |
| Tools/Emulator | [![Emulator:Build](https://github.com/visualengineers/reflex/actions/workflows/emulator-build.yml/badge.svg#build-status)](https://github.com/visualengineers/reflex/actions/workflows/emulator-build.yml) |

## Repository structure

| Directory  | Content                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------- |
| `apps`     | Applications using the `ReFlex` framework                                                     |
| `design`   | Design / Graphic source files                                                                 |
| `docs`     | documentation for github pages                                                                |
| `examples` | Templates and Plugins (`Angular`, `Vue.js`, `React`, `Unreal Engine 5`, `Unity`. `.NET`)      |
| `external` | Place for external libraries, if needed (see [External Dependencies](#external-dependencies)) |
| `library`  | `ReFlex` .NET library                                                                         |
| `packages` | Shared Typescript code between applications (see [Use Shared Code](#use-shared-code))         |
| `scripts`  | additional automation scripts either for CI or local development                              |
| `services` | Micro services for extending server capabilities                                              |
| `test`     | Test projects, test artifacts, `Insomnia` workspace                                           |
| `tools`    | Developer Tools and Server application                                                        |

__[⬆ back to top](#table-of-contents)__

### NPM workspaces

The repository uses NPM workspaces for better management of dependencies

Therefore, the repository should be initialized in the root folder by running the command `npm install` and not in the sub directories (although there are package.json files, but these files are just handling the local dependencies)

__[⬆ back to top](#table-of-contents)__

### Repository initialization

* copy [ExternalDependencies](#external-dependencies) into `external`
* run `npm run build:shared-types` to build shared types library
* run `npm install` in root directory
* if building with electron: Install Electron-Builder globally by running: `npm install electron -g`

__[⬆ back to top](#table-of-contents)__

### Development

* Adding a new workspace: `npm init -w ./path/to/workspace/directory`
* Adding packages to workspace: `npm install -w ./path/to/workspace/directory package --save` (in workspace root directory)

__[⬆ back to top](#table-of-contents)__

## External Dependencies

* The following dlls need to be placed in the `external` directory for use with the associated depth cameras
* ~~__Intel RealSense R2/D435/L515__ `Intel.Realsense.dll`, `libpxcclr.cs.dll`, `libpxccpp2c.dll`, `realsense2.dll` from [Intel RealSense SDK](https://github.com/IntelRealSense/librealsense/releases)~~ (Files are included as nuget package)
* __Microsoft Kinect__ `Microsoft.Kinect.dll`, `Microsoft.Kinect.xml` from [Microsoft Kinect for Windows SDK 2.0](https://www.microsoft.com/en-us/download/details.aspx?id=44561)
* for compatibility reasons, no sensors are included in the build process by default. To include specific sensors use the appropriate flags described in the Server documentation

__[⬆ back to top](#table-of-contents)__

## use shared code

* for using `reflex-shared-types` in another project, just install it as workspace dependency in the current project with
  
  ``` bash
    npm install ./packages/reflex-shared-types -w ./tools/ReFlex.TrackingServer/ClientApp --save
  ```

* types are available by importing `@reflex/shared-types`

__[⬆ back to top](#table-of-contents)__

## NPM commands

| Command                                       | Description                                                                                | Remarks                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `npm run build`                               | runs `build` command in all subrepos of workspace                                          |                                                                                                     |
| `npm run build-complete`                      | runs `build` command in all subrepos of workspace, including `test-ci` and `lint` commands |                                                                                                     |
| `npm run build:shared-types`                  | builds package [Shared Types](#use-shared-code)                                            |                                                                                                     |
| `npm run build:shared-components`             | builds Shared Angular Components(#use-shared-code)                                         |                                                                                                     |
| `npm run build:electron-win`                  | builds *ReFlex.TrackingServer* as Electron app packaged for Windows                        |                                                                                                     |
| `npm run build:electron-osx`                  | builds *ReFlex.TrackingServer* as Electron app packaged for OSX (Intel x64)                | needs to be run on macOS                                                                            |
| `npm run build:electron-osx-arm64`            | builds *ReFlex.TrackingServer* as Electron app packaged for OSX (ARM64)                    | needs to be run on macOS                                                                            |
| `npm run build:electron-linux`                | builds *ReFlex.TrackingServer* as Electron app packaged for Linux (x64)                    |                                                                                                     |
| `npm run build:electron-linux-arm64`          | builds *ReFlex.TrackingServer* as Electron app packaged for Linux (ARM64)                  |                                                                                                     |
| `npm run build:emulator`                      | builds Emulator Angular App                                                                |                                                                                                     |
| `npm run build:emulator:electron-win`         | builds *Emulator* as  Electron app packaged for Windows (x64)                              | `npm install` is executed after packaging to restore the dev dependencies                           |
| `npm run build:emulator:electron-osx`         | builds *Emulator* as  Electron app packaged for Windows (x64)                              | `npm install` is executed after packaging to restore the dev dependencies, needs to be run on macOS |
| `npm run build:emulator:electron-osx-arm64`   | builds *Emulator* as  Electron app packaged for Windows (x64)                              | `npm install` is executed after packaging to restore the dev dependencies, needs to be run on macOS |
| `npm run build:emulator:electron-linux`       | builds *Emulator* as  Electron app packaged for Windows (x64)                              | `npm install` is executed after packaging to restore the dev dependencies                           |
| `npm run build:emulator:electron-linux-arm64` | builds *Emulator* as  Electron app packaged for Windows (x64)                              | `npm install` is executed after packaging to restore the dev dependencies                           |
| `npm run build:example-angular`               | builds Angular Template                                                                    |                                                                                                     |
| `npm run build:example-react`                 | builds React Template                                                                      |                                                                                                     |
| `npm run build:example-vue`                   | builds Vue.js Template                                                                     |                                                                                                     |
| `npm run build:logging`                       | builds *Logging* tool                                                                      |                                                                                                     |
| `npm run start:emulator`                      | build and start *Emulator* Angular app on `localhost:4300`                                 |                                                                                                     |
| `npm run start:example-angular`               | build and start Angular Template on `localhost:4201`                                       |                                                                                                     |
| `npm run start:example-react`                 | build and start React Template on `localhost:3000`                                         |                                                                                                     |
| `npm run start:example-vue`                   | build and start Vue.js Template on `localhost:8080`                                        |                                                                                                     |
| `npm run start:logging`                       | build and start *Logging* tool on `localhost:4302`                                         |                                                                                                     |
| `npm run start:server`                        | build and start *ReFlex.TrackingServer* tool (only Angular frontend) on `localhost:4200`   | Server backend must be started separately                                                           |
| `npm run lint:emulator`                       | executes linter on *Emulator* project                                                      |                                                                                                     |
| `npm run lint:server`                         | executes linter on *ReFlex.TrackingServer* project                                         |                                                                                                     |
| `npm run test:emulator`                       | executes tests on *Emulator* project                                                       |                                                                                                     |
| `npm run test:net-with-report`                | executes .NET tests on .NET Solution *ReFlex.sln* and generates report for tests           | Currently only compatible with Windows                                                              |
| `npm run test:server`                         | executes tests on *ReFlex.TrackingServer* project                                          |                                                                                                     |

__[⬆ back to top](#table-of-contents)__

### Known issues

* Electron seems not to be perfectly suitable to be used in monorepos, as building the app in the package process removes all dev dependencies, including the `electron-builder` package if installed locally  
  Therefore, `electron-builder` needs to be installed globally before executing a `build:emulator:electron-xxx` script
* Additionally, `npm install` is executed after packaging to restore the dev dependencies
* if a command `build:emulator:electron-xxx` is executed from within the emulator project, `npm install` has to be executed manually afterwards

__[⬆ back to top](#table-of-contents)__

## Python gRPC Processing service

* as an example for integrating external services, a python gRPC service for extracting interactions from the camera depth image is provided in `services/python-backend`
* service is consumed when setting Interaction Processor to `Remote`
* in the `ReFlex.TrackingServer`, the service is configured in `Services/RemoteInteractionProcessingService.cs`
* Documentation: [Python gRPC service](services/python-backend/README.md)

__[⬆ back to top](#table-of-contents)__

## Known issues / Troubleshooting

* `Karma Test Explorer` Plugin for vs code does not work well with the current npm workspace setup, as it does not identify the correct angular path. In order to use the plugin, the global angular installation is used as fallback.
* if an application behaves different when executing the packaged electron version (either installed using the setup or the executable in the `win-unpacked directory)`), this may be caused by outdated Electron Cache. In this case, open
  * `%AppData%` Folder (Windows)
  * `~/.config` Folder (Linux)
  * `~/Library/Application Support/` (MacOS)  
and delete the app folder there
* to delete all temporary folders / cached packages / build artifacts, run the following command in the `scripts` folder:

  ``` bash
   ./cleanup_packages.sh package-directories.txt
  ```

__[⬆ back to top](#table-of-contents)__
