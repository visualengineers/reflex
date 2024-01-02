# ReFlex.TrackingServer

Platform-independent server application using ASP.NET Core as backend and Angular as frontend. Replaces the legacy ServerWPF app.

<!-- omit in toc -->
## Table of Contents

1. [Installation and start](#installation-and-start)
2. [.NET Testing](#net-testing)
3. [Backend Logging](#backend-logging)
4. [SignalR Hubs](#signalr-hubs)
5. [Insomnia](#insomnia)
6. [Development certificates](#development-certificates)
7. [Developing Angular ClientApp](#developing-angular-clientapp)
8. [Electron Desktop app](#electron-desktop-app)
9. [Azure Kinect Build issues](#azure-kinect-build-issues)
10. [Depth Camera issues](#depth-camera-issues)
11. [Known Issues](#known-issues)


## Installation and start

- Prerequisites:
  - .NET 6.0  
    [Download](https://dotnet.microsoft.com/download/dotnet-core)
  - node js v. 18 oder higher  
    [Download](https://nodejs.org/en/)
  - C# Extension for VS Code (for debugging)  
    [Download](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csharp)
  - Depth Sensor Support:
    - Azure Kinect
      - requires __Microsoft Visual C++ Redistributable für Visual Studio 2015__ [Download](https://click.linksynergy.com/deeplink?id=09*qMXuOFN0&mid=46131&murl=https%3A%2F%2Fwww.microsoft.com%2Fde-de%2Fdownload%2Fdetails.aspx%3Fid%3D48145)
      - Azure Kinect SDK [Download](https://github.com/microsoft/Azure-Kinect-Sensor-SDK/blob/develop/docs/usage.md)
      - github Documentation [github Repository](https://github.com/microsoft/Azure-Kinect-Sensor-SDK)
    - Kinect 2
      - Kinect for Windows SDK 2.0 [Download](https://www.microsoft.com/en-us/download/details.aspx?id=44561)
    - Intel RealSense R2, D435, L515
  
- navigate to `ClientApp/` subdirectory

- `npm install` for fetching node packages (on first start)
- `npm start` in Visual Studio Code / Terminal (for local Angular CLI)

1. Option: (Debugging in Visual Studio)
   - Start "TrackingServer" in Visual Studio (for running backend)
   - launch `Chrome` launch config for Angular debugging

2. Option (Debugging in Visual Studio __Code__):
   - prerequisite: app must be build beforehand in Visual Studio
   - launch `Core & Chrome` launch config

- app runs at `https://localhost:5001`

__[⬆ back to top](#table-of-contents)__
___

## .NET Testing

- Test coverage and HTML based coverage report are stored in `./test/artifacts/coverage-net/`

- Prerequisites:

  - dotnet-reportgenerator-globaltool
    `dotnet tool install --global dotnet-reportgenerator-globaltool`
  - each test project needs to have nuget package `coverlet.collector` installed

  - delete directory `./test/artifacts/coverage-net/`
  - execute tests and generate reports in `./test/artifacts/coverage-net/cobertura`
    `dotnet test --collect:"XPlat Code Coverage" --results-directory: ./test/artifacts/coverage-net/cobertura/`
    **REMARKS:** a folder named with a random guid containing the report is generated for each test assembly
  - generate report by collecting all cobertura files (when using globbing for specifying reports in subdirectories the argument for `reports` must be wrapped in `"`)
    `reportgenerator -reports:"./test/artifacts/coverage-net/cobertura/**/coverage.cobertura.xml" -targetdir:"./test/artifacts/coverage-net/report" -reporttypes:Html -assemblyfilters:"+ReFlex.*;-*.Test"`    

For more options, refer to [Online Configuration Tool for Report Generator](https://reportgenerator.io/usage)

- for including in gitlab ci / as github action: see [Generating Code Coverage Reports in .NET Core](https://dotnetthoughts.net/generating-code-coverage-reports-in-dotnet-core/)
  - basically install steps need to be done on start, then commands above can be run

Alternative, using tool dotnet-coverage (only on Windows)

- Install **dotnet-coverage**
  `dotnet tool install --global dotnet-coverage`
- execute tests and generate coverage report: 
  `dotnet coverage collect dotnet test --output ./test/artifacts/coverage-net/cobertura-coverage.xml --output-format cobertura`
- generate report:
  `reportgenerator -reports:./test/artifacts/coverage-net/cobertura-coverage.xml -targetdir:"./test/artifacts/coverage-net/report" -reporttypes:Html -assemblyfilters:"+ReFlex.*;-*.Test"`

- further information:
  - [online configuration](https://reportgenerator.io/usage)
  - [github repo](https://github.com/danielpalme/ReportGenerator)

- *REMARKS*: if specifying more than one argument for parameter `assemblyfilters`, the argument need to be wrapped in `"` 
  - use `-assemblyfilters:"+ReFlex.*;-*.Test"` instead of `-assemblyfilters:+ReFlex.*;-*.Test`

## Backend Logging

- Backend uses `NLog` for logging. `NLog` can be configured in the `appsettings.json` (with additional rules in `appsettings.development.json` applied in development environments and `appsettings.production.json` for productive environments). The environment is set during __Runtime__ by providing the arguments `"ASPNETCORE_ENVIRONMENT": "production" | "development"` (see [`launch.json`](.vscode/launch.json)) on `dotnet run`
- ASP.NET provides very detailed logging for every request. For development, this is rendered to the console. However, if this is not desired, these logs can be filtered in the nlog configuration. This can eb done by changing the `maxLevel` Attribute in the nlog rules section for

``` json
  {
    "logger": "Microsoft.*",
    "maxLevel": "Debug",
    "final": true
  }
```

- the mechanism above acts like a filter: it takes all messages with a level lower than `Debug` and send it to a target without a specified output (and therefore effectively removes all messages for the following loggers)
- __Remarks:__ ASP.NET Logging levels can also be adjusted in the app settings, however, this only seems to affect the logging to file, as NLog still receives the logs even after disabling them

## SignalR Hubs

For sending status information and updates as well as data like point cloud, there are `SignalR`-Hubs available in the backend:

| Service        | Mapping          | Methods                                                       | Description                                      |
| -------------- | ---------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| TrackingHub    | `/trkhub`        | `startState`/`stopState`                                      | current status of sensor                         |
| NetworkHub     | `/nethub`        | `startState`/`stopState`                                      | current status of network broadcast              |
| PointCloudHub  | `/pointcloudhub` | `startState`/`stopState`                                      | whether pointcloud is active or not              |
|                |                  | `startPointCloud`/`stopPointCloud`                            | receive point cloud data                         |
| TuioHub        | `/tuiohub`       | `startState`/`stopState`                                      | whether tuioservice is sending or not            |
|                |                  | `startPackageDetails`/`stopPackageDetails`                    | receive tuio packages (as string)                |
| PerformanceHub | `/perfhub`       | `startState`/`stopState`                                      | whether performance data is collected or not     |
|                |                  | `startCollectingData`/`stopCollectingData`                    | receive performance data                         |
| CalibrationHub | `/calibhub`      | `startState`/`stopState`                                      | whether a valid calibration has been set or not  |
|                |                  | `startCalibrationSubscription`/`sttopCalibrationSubscription` | receive calibration updates                      |
| ProcessingHub  | `/prochub`       | `startState`/`stopState`                                      | whether ainteraction processing is active or not |
|                |                  | `startInteractions`/`stopInteractions`                        | receive interactions                             |
|                |                  | `startInteractionFrames`/`stopInteractionFrames`              | receive interaction frames                       |
|                |                  | `startInteractionHistory`/`stopInteractionHistory`            | receive interaction history                      |

- __REMARKS:__ Testing `SignalR` is a little bit more complex, as the SignalR-protocol follows a specific procedure:
    1. *negotiate connection:* acquire a `connectionId` and `connectionToken` for identifying the sender:  
      `https://localhost:5001/prochub/negotiate?negotiateVersion=1` (`POST` Request)
    1. *connect with token:* connect using the provided connection token:  
       `https://localhost:5001/prochub?id=xyA0WRiSp_f_UJ3bICalPQ` (`POST` Request, not necessary, can be done when connecting websocket)
    1. *establish connection:* connect with the token and start communicating:  
      `wss://localhost:5001/prochub?id=xyA0WRiSp_f_UJ3bICalPQ` (`WebSocket` communication)  
      with body:

    ``` json
      {"protocol":"json","version":1}                          // always needs to be the first message
      {"arguments":[],"target":"startState","type":1}          // call function
      {"arguments":[],"target":"StartInteractions","type":1}   // call another
    ```

    1. *send messages:* send and receive data
      Example: `wss://localhost:5001/prochub?id=xyA0WRiSp_f_UJ3bICalPQ` (`WebSocket` communication)
      with body:

    ``` json
      {"arguments":[],"target":"startState","type":1}          // call function
      {"arguments":[],"target":"StartInteractions","type":1}   // call another
    ```

- __IMPORTANT__:  
  - Message 1-3 must be sent within a certain time limit to prevent timeout/automatic disconnect
  - the json message must end with the  terminal character (can be retrieved by debugging the connection with chrome and copy message)

## Insomnia

HTTP-Requests, Websocket communication and gRPC communication can be tested using [`Insomnia`](https://insomnia.rest/).
The request provided by the ASP.NET backend are exported as workspace and can be found in [Insomnia Workspace Export](/Test/Insomnia/Insomnia_Workspace.json).

For testing SignalR, Insomnia offers the feature of *chained Requests* [Documentation](https://docs.insomnia.rest/insomnia/chaining-requests), therefore it is not necessary to copy the response values in the address bar. Just sending the requests in the correct order should be sufficient.
The current Workspace provides three methods:

- `negotiate`:  
  acquires connectionToken (required first step)
- `connectWithToken`:  
  connect with a HTTP POST request (can be omitted)
- `establishConnection`:  
  opens the websocket connection with the provided token and sends messages (click on `send` afer connecting)  
  __REMARK:__ there is one drawback of using websocket connections: there can be no second connection with the same token, therefore messages must be sent with this provided method by replacing the json body which is rather problematic, due to the terminal character

## Development certificates

- .NET Core supplies some self-signed developer certificates for use with HTTPS. However, these are marked as invalid, because the browser can ot verify the certificates. In order to get rid of the rather cumbersome "I know the risk, continue anyway..." - message in the browser, there is an option to install the dev certificates locally.

To do this, run the following command in an elevated command prompt / powershell / etc...

``` bash
  dotnet dev-certs https --trust  
```

if there are other certificates already installed, these can be removed by the following commands:

``` bash
  dotnet dev-certs https --clean
```

Subsequently, it should be possible to install the certificates with the commands stated above.  

However, if these commands don't work, it is also possible to globally install the dev certs:

``` bash
  dotnet tool uninstall --global dotnet-dev-certs 
  dotnet tool install --global dotnet-dev-certs
```

__[⬆ back to top](#table-of-contents)__
___

## Developing Angular ClientApp

- as the development folder contains nested Angular modules, it is necessary to specify the relevant module, when using angular CLI using `--module` parameter, eg:

``` bash

  ng g c myComponent --module app # creates myComponent in open source mono repo for ReFlex.TrackingServer/ClientApp/src/app 

```

__[⬆ back to top](#table-of-contents)__
___

## Electron Desktop app

- Angular / ASP.NET Core web app can be build as Desktop app using [ElectronNET](https://github.com/ElectronNET/Electron.NET) library

### Prerequisites

- globally installed tool `electronize` (matching current *Electron.NET* version). To install/update the tool, run:

  ``` bash
    dotnet tool install ElectronNET.CLI -g
  ```

- for updating electron cli:

  ``` bash
    dotnet tool update ElectronNET.CLI -g
  ```

### Building the App

- to start electron App, go to `ReFlex.TrackingServer` main folder and run the command:

  ``` bash
    electronize start
  ```

  (optionally, the parameter `/watch` can be added to force recompilation when code changes are detected)

- for building an application package, the following command is used, depending on thr desired target platform:

  ``` bash
    electronize build /target win
    electronize build /target osx
    electronize build /target linux
  ```

- __IMPORTANT:__ `ElectronNET` does not correctly execute the `dotnet publish` command if `.NET5.0` or higher is used (see [github issue](https://github.com/ElectronNET/Electron.NET/issues/532)).

- Therefore, use the following command instead:
  
  ```bash
    electronize build .\ReFlex.TrackingServer.csproj /PublishSingleFile false /PublishReadyToRun false /p:Configuration=Release /p:Platform=x64 /target win
    electronize build .\ReFlex.TrackingServer.csproj /PublishSingleFile false /PublishReadyToRun false /p:Configuration=Release /p:Platform=x64 /target osx
    electronize build .\ReFlex.TrackingServer.csproj /PublishSingleFile false /PublishReadyToRun false /p:Configuration=Release /p:Platform=x64 /target linux
  ```

  For building for the ARM64 Platform, the custom target must be specified to build for ARM-based MACs:

  ```bash
    electronize build .\ReFlex.TrackingServer.csproj /PublishSingleFile false /PublishReadyToRun false /p:Configuration=Release /p:Platform=ARM64 /target custom "osx-arm64;" /electron-arch arm64
  ```

  or for Linux-ARM:

  ```bash

  electronize build .\ReFlex.TrackingServer.csproj /PublishSingleFile false /PublishReadyToRun false /p:Configuration=Release /p:Platform=ARM64 /target custom "linux-arm64;" /electron-arch arm64 

  ```

  or use the prepared npm commands (from `ClientApp` directory):

  ``` bash
    npm run build:electron-win
    npm run build:electron-osx
    npm run build:electron-osx-arm64
    npm run build:electron-linux
    npm run build:electron-linux-arm64
  ```


- App package can be found in `bin/Desktop` folder

  __IMPORTANT:__ Building for mac does not work on Windows, because they require symlinks which are not supported on Windows.

### Remarks

- internally, the ports are different, when using the web app (default: `8000` instead of `5000`/`5001`in the development setup).
- HTTPS is not supported (therefore, angular websockets also only use `ws` instead of `wss`)
- Settings for electron build can be modified in the `electron.manifest.json` located in the `ReFlex.TrackingServer` directory
- File operations: the internal web server implementation used by Electron seems to be more strict than the development Server (Kestrel). Therefore, file operations on unknown file types result in redirects to an error page (happened, when trying to load `*.frag` / `*.vert`) for fragment/vertex shader code. Solution: use default file types (e.g. `txt`, `png`, `jpg`, ...)
- Azure Kinect dlls are not copied by default. (App throws an error the AzureKinect libraries cannot be found on startup - see log) Therefore, an additional setting has been added to `electron.manifest.json` to force copy of external dlls to app directory:

  ``` JSON
    "extraResources": [
      {
        "from": "../../../../library/export/Modules",
        "to": "bin",
        "filter": [ "**/*" ]
      }
    ]
  ```

__[⬆ back to top](#table-of-contents)__
___

## Azure Kinect Build issues

AzureKinect nuget Package contains a platform check based on Visual Studio Environment variables that stops VS Code from build (because the env-vars are not defined in VSCode).

`C:\Users\...\.nuget\packages\microsoft.azure.kinect.sensor\1.4.1\build\netstandard2.0\Microsoft.Azure.Kinect.Sensor.targets(4,5): error : Azure Kinect only supports the x86/x64 platform ('AnyCPU' not supported)`

If that's the case, open the file targets file of the package and remove the check:

``` XML

  <!-- remove the complete element -->
  <Target Name="EnsureAzureKinectPlatform" BeforeTargets="PrepareForBuild">      
    <Error Condition="'$(Platform)' != 'x64' AND '$(Platform)' != 'x86' AND '$(OutputType)'!='Library'" Text="Azure Kinect only supports the x86/x64 platform ('$(Platform)' not supported)" />
  </Target>

```

refer to [GitHub issue](https://github.com/microsoft/Azure-Kinect-Sensor-SDK/issues/894)

__[⬆ back to top](#table-of-contents)__
___

## Depth Camera issues

- RealSense should work on Windows
- Emulator should work everywhere
- Kinect 2 currently doesn't load the correct DLL as it needs to be retrieved from GAC (console and desktop apps automatically access the GAC, ASP.NET Core does not)
  this means that Kinect 2 is __not working__ on Linux/Mac Systems.
- When compiling with VSCode, Azure Kinect DLLs are not copied to Output Directory. To use Azure Kinect, the files need to be copied manually (typically, DLLS are located at `C:\Users\...\.nuget\packages\microsoft.azure.kinect.sensor\1.4.1\lib\netstandard2.0` (on Windows));

__[⬆ back to top](#table-of-contents)__
___

## Known Issues

- Electron App crashes on startup - One possible issue relates to a missing certificate. error should be like this:
  
  ``` log
    System.InvalidOperationException: Unable to configure HTTPS endpoint. No server certificate was specified, and the default developer certificate could not be found or is out of date.
  To generate a developer certificate run 'dotnet dev-certs https'. To trust the certificate (Windows and macOS only) run 'dotnet dev-certs https --trust'.
  For more information on configuring HTTPS see https://go.microsoft.com/fwlink/?linkid=848054.
  ```
  
  __Solution:__ Install dev certificates on the machine using `'dotnet dev-certs https --trust'

- Path to `ReFlex.TrackingServer.dll` in `launch.json` is different when building with VS Code or Rider/Visual Studio. In case of building with VS Code: Change

  ``` json
  "program": "${workspaceFolder}/TrackingServer/bin/Debug/net6.0/ReFlex.TrackingServer.dll",
  ```

  to

  ``` json
  "program": "${workspaceFolder}/TrackingServer/bin/x64/Debug/net6.0/ReFlex.TrackingServer.dll",
  ```

  in `.NET Core` Configuration

- when running `npm install`, rebuilding `node-gyp` may fail due to missing Python2. IN this case, update your global npm installation by using
  
  ``` bash
  npm install - g npm
  ```

- OmniSharp does not correctly load AzureKinectModule Project due to incorrectly using Platform 'AnyCPU' on project load. This results in Errors displayed in VS Code. Actually, building the project succeeds (as platform is enforced in build parameters so the build process uses the correct processor architecture). Therefore Errors related to missing AzureKinectModule types or namespaces can be ignored
However, this behaviour can be stopped by editing the targets file of the nuget package (typically, DLLS are located at `C:\Users\...\.nuget\packages\microsoft.azure.kinect.sensor\1.4.1\lib\netstandard2.0` (on Windows)); by removeing / commenting the lines in `Microsoft.Azure.Kinect.Sensor.targets` file:

```XML
<Project ToolsVersion="15.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <!-- <Target Name="EnsureAzureKinectPlatform" BeforeTargets="PrepareForBuild">
    <Error Condition="'$(Platform)' != 'x64' AND '$(Platform)' != 'x86'" Text="Azure Kinect only supports the x86/x64 platform ('$(Platform)' not supported)" />
  </Target> -->
```

- if __Microsoft Azure Kinect__ is not available as sensor and the error `k4a.dll cannot be found` is logged: make sure __Visual C++ Redistributable__ is installed on the machine (see [Prerequisites](#installation-and-start)).

__[⬆ back to top](#table-of-contents)__
___
