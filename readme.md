# ReFlex

Software Development SDK for __Elastic Displays__ as open source mono repo

* .NET Core library as framework for different depth sensors, calibration, depth image filtering and reconstruction of interactions
* APS.NET Core / Angular server application as frontend for library
* can be packaged as electron app for desktop
* Example client applications for Plain HTML, Angular, React, Vue.js, Plugins for Unity, Unreal Engine 5
* Emulator as Development Tool
* Example Applications

[![Library:Build](https://github.com/visualengineers/reflex/actions/workflows/library-build.yml/badge.svg)](https://github.com/visualengineers/reflex/actions/workflows/library-build.yml)
[![Library:Test](https://github.com/visualengineers/reflex/actions/workflows/library-test.yml/badge.svg)](https://github.com/visualengineers/reflex/actions/workflows/library-test.yml)

[![Shared Types:Build](https://github.com/visualengineers/reflex/actions/workflows/shared-build.yml/badge.svg)](https://github.com/visualengineers/reflex/actions/workflows/shared-build.yml)

[![Server:Build](https://github.com/visualengineers/reflex/actions/workflows/server-build.yml/badge.svg)](https://github.com/visualengineers/reflex/actions/workflows/server-build.yml)
[![Server:Lint](https://github.com/visualengineers/reflex/actions/workflows/server-lint.yml/badge.svg)](https://github.com/visualengineers/reflex/actions/workflows/server-lint.yml)
[![Server:Test](https://github.com/visualengineers/reflex/actions/workflows/server-test.yml/badge.svg)](https://github.com/visualengineers/reflex/actions/workflows/server-test.yml)

[![Emulator:Build](https://github.com/visualengineers/reflex/actions/workflows/emulator-build.yml/badge.svg)](https://github.com/visualengineers/reflex/actions/workflows/emulator-build.yml)

<!-- omit in toc -->
## Table of contents

1. [Documentation](#documentation)
2. [Repository structure](#repository-structure)
3. [External Dependencies](#external-dependencies)
4. [use shared code](#use-shared-code)
5. [ReFlex.TrackingServer](#reflextrackingserver)
6. [Emulator](#emulator)
7. [Python gRPC Processing service](#python-grpc-processing-service)
8. [CI](#ci)
9. [Known issues](#known-issues)

## Documentation

**TODO:** create github pages for documentation

## Repository structure

| Directory  | Content                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------- |
| `apps`     | Applications using the `ReFlex` framework                                                     |
| `design`   | Design / Graphic source files                                                                 |
| `examples` | Templates and Plugins (`Angular`, `Vue.js`, `React`, `Unreal Engine 5`, `Unity`. `.NET`)      |
| `external` | Place for external libraries, if needed (see [External Dependencies](#external-dependencies)) |
| `library`  | `ReFlex` .NET library                                                                         |
| `packages` | Shared Typescript code between applications (see (#use-shared-code))                          |
| `services` | Micro services for extending server capabilities                                              |
| `test`     | Test projects, test artifacts, `Insomnia` workspace                                           |
| `tools`    | Developer Tools and Server application                                                        |

### NPM workspaces

The repository uses NPM workspaces for better management of dependencies

Therefore, the repository should be initialized in the root folder by running the command `npm install` and not in the sub directories (although there are package.json files, but these files are just handling the local dependencies)

### Repository initialization

* copy [ExternalDependencies](#external-dependencies) into `external`
* run `npm run build:shared-types` to build shared types library
* run `npm install` in root directory
* if building with electron: Install Electron-Builder globally by running: `npm install electron -g`

### Development

* Adding a new workspace: `npm init -w ./path/to/workspace/directory`
* Adding packages to workspace: `npm install -w ./path/to/workspace/directory package --save` (in workspace root directory)

## External Dependencies

* The following dlls need to be placed in the `external` directory for use with the associated depth cameras
* __Intel RealSense R2/D435/L515__ `Intel.Realsense.dll`, `libpxcclr.cs.dll`, `libpxccpp2c.dll`, `realsense2.dll` from [Intel RealSense SDK](https://github.com/IntelRealSense/librealsense/releases)
* __Microsoft Kinect__ `Microsoft.Kinect.dll`, `Microsoft.Kinect.xml` from [Microsoft Kinect for Windows SDK 2.0](https://www.microsoft.com/en-us/download/details.aspx?id=44561)
* if the sensors listed above are not relevant; the .NET solution can be built using the preprocessor flag `NO_EXTERNAL_SENSORS` by using one of the following methods:
  * `dotnet build ReFlex.sln -c CI` (use Solution Configuration `CI` which includes the definition of the mentioned Constant)
  * edit `ReFlex.sln` and change the line `<DefineAdditionalConstants/>` to `<DefineAdditionalConstants>NO_EXTERNAL_SENSORS</DefineAdditionalConstants>`

## use shared code

* for using `reflex-shared-types` in another project, just install it as workspace dependency in the current project, e.g. `npm install ./packages/reflex-shared-types -w ./tools/ReFlex.TrackingServer/ClientApp --save`
* types are available by importing `@reflex/shared-types`

## ReFlex.TrackingServer

* Build TrackingServer: run `npm run build:electron-win` / `npm run build:electron-osx` / `npm run build:electron-linux` (OSX can only be built in macOS)
  
* see [ReFlex.TrackingServer readme](tools/ReFlex.TrackingServer/readme.md)

## Emulator

* Electron seems not to be perfectly suitable to be used in monorepos, as building the app in the package process removes all dev dependencies, including the electron-.builder package if installed locally  
  Therefore, `electron-builder` neds to be installed globally before executing the `build:emulator:electron-win` script
* Additionally, `npm install` is executed after packaging to restore the dev dependencies
* if the script `build:electron-win` is executed from within the emulator project, `npm install` has to be executed manually afterwards

## Python gRPC Processing service

* as an example for integrating external services, a python gRPC service for extracting interactions from the camera depth image is provided in `services/python-backend`
* service is consumed when setting Interaction Processor to `Remote`
* in the `ReFlex.TrackingServer`, the service is configured in `Services/RemoteInteractionProcessingService.cs`
* Documentation: [Python gRPC service](services/python-backend/README.md)

## CI

* TODO: setup and document CI

## Known issues

* `Karma Test Explorer` Plugin for vs code does not work well with the current npm workspace setup, as it does not identify the correct angular path. In order to use the plugin, the global angular installation is used as fallback.
* if the application behaves different when executing the packaged electron version (either installed using the setup or the executable in the `win-unpacked directory)`), this may be caused by outdated Electron Cache. In this case, open `%AppData%` Folder (Windows) and delete the folder `reflex.trackingserver`
