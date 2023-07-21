# ReFlex

* App Development SDK for __Elastic Displays__ as open source mono repo

Angular: Install and lint
[![Angular Frontend - Install and Linter](https://github.com/visualengineers/reflex-server/actions/workflows/main.yml/badge.svg)](https://github.com/visualengineers/reflex-server/actions/workflows/main.yml)

TrackingServer: Build Electron App (Win)
[![TrackingServer - Build Electron.NET (Win)](https://github.com/visualengineers/reflex-server/actions/workflows/backend.yml/badge.svg)](https://github.com/visualengineers/reflex-server/actions/workflows/backend.yml)

<!-- omit in toc -->
## Table of contents

1. [Documentation](#documentation)
2. [Repository structure](#repository-structure)
3. [External Dependencies](#external-dependencies)
4. [ReFlex.TrackingServer](#reflextrackingserver)
5. [CI](#ci)

## Documentation

**TODO:** create github pages for documentation

## Repository structure

| Directory  | Content                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------- |
| `apps`     | Applications using the `ReFlex` framework                                                     |
| `ci`       | CI-files for github and gitlab                                                                |
| `design`   | Design / Graphic source files                                                                 |
| `examples` | Templates and Plugins (`Angular`, `Vue.js`, `React`, `Unreal Engine 5`, `Unity`. `.NET`)      |
| `external` | Place for external libraries, if needed (see [External Dependencies](#external-dependencies)) |
| `library`  | `ReFlex` .NET library                                                                         |
| `services` | Micro services for extending server capabilities                                              |
| `test`     | Test projects, test artifacts, `Insomnia` workspace                                           |
| `tools`    | Developer Tools and Server application                                                        |

## External Dependencies

* The following dlls need to be placed in the `external` directory for use with the associated depth cameras
* __Intel RealSense R2/D435/L515__ `Intel.Realsense.dll`, `libpxcclr.cs.dll`, `libpxccpp2c.dll`, `realsense2.dll` from [Intel RealSense SDK](https://github.com/IntelRealSense/librealsense/releases)
* __Microsoft Kinect__ `Microsoft.Kinect.dll`, `Microsoft.Kinect.xml` from [Microsoft Kinect for Windows SDK 2.0](https://www.microsoft.com/en-us/download/details.aspx?id=44561)

## ReFlex.TrackingServer

* see [ReFlex.TrackingServer readme](tools/ReFlex.TrackingServer/readme.md)

## CI

* TODO: setup and document CI