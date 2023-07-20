# ReFlex open source mono-repo

<!-- omit in toc -->
## Table of contents

1. [Documentation](#documentation)
2. [Repository structure](#repository-structure)
3. [External Dependencies](#external-dependencies)

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
| `services` | Micro services for exn´tending server capabilities                                            |
| `test`     | Test projects, test artifacts, `Insomnia` workspace                                           |
| `tools`    | Developer Tools and Server application                                                        |

## External Dependencies

* `Intel.Realsense.dll`, `libpxcclr.cs.dll`, `libpxccpp2c.dll`, `realsense2.dll` from [Intel RealSense SDK]()
* `Microsoft.Kinect.dll`, `Microsoft.Kinect.xml` from [Microsoft Kinect for Windows v2 SDK]()
