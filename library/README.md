# ReFlex.Library

Core Library for Development of applications for __Elastic Displays__. Created in context of research project __ZELASTO__ (EFRE-project no. 100376687) in cooperation with HTW Dresden.

## Project setup

### Frameworks

* .NET 7.0

### IDEs

* Microsoft Visual Studio
  * recommended: ReSharper Extension
* JetBrains Rider
* Visual Studio Code

### nuget Packages

#### general

| Library                  | Version | Description                                                      |
| ------------------------ | ------- | ---------------------------------------------------------------- |
| __Prism.Core__           | 8.1.97  | Dedpendency Injection / Commanding / Event Aggregation utilities |
| __Newtonsoft.Json__      | 13.0.3  | JSON-Serializer                                                  |
| __NLog__                 | 5.1.3   | Universal logging framework for .NET                             |
| __SixLabors.ImageSharp__ | 2.1.3   | platform-independent graphics library                            |
| __MathNet.Filtering__    | 0.7.0   | filter algorithms                                                |
| __MathNet.Numerics__     | 5.0.0   | matrix operations                                                |

### Connectivity

| Library                 | Version | Description                                 |
| ----------------------- | ------- | ------------------------------------------- |
| __websocketsharp.core__ | 1.0.0   | .net standard library for using web sockets |
| __CoreOSC__             | 1.0.0   | .net Core library for OSC messages (TUIO)   |
| __Grpc.AspNetCore__     | 2.52.0  | ASP.NET plugin for gRPC Calls               |
| __WatsonTcp__           | 5.0.11  | Library for Tcp communication               |

### Development

| Library                    | Version | Description                                                  |
| -------------------------- | ------- | ------------------------------------------------------------ |
| __BenchmarkDotNet__        | 0.13.5  | performance analysis used for emulator and point cloud       |
| __Moq__                    | 4.18.4  | .NET mocking library                                         |
| __NUnit__                  | 3.13.3  | .NET Testing framework                                       |
| __coverlet.collector__     | 6.0.0   | necessary for generating test reports (platform independent) |
| __Microsoft.CodeCoverage__ | 17.8.0  | Code coverage                                                |

## Project Structure

| Group           | Project                                | Description                                                                                                                                                                                                                                                                                                                |
| --------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| __Core__        |                                        | __Contains base functionality of DepthSensing Framework. Platform-independent .NET libraries__                                                                                                                                                                                                                             |
|                 | *ReFlex.Core.Calibration*              | Implementation of semi-automatic mapping algorithm. Based on three linear-independent reference points the associated points in the depth image have to be specified. From this relative transformation a linear transformation in XY-Plane (Translate, scale, rotate, shear) is computed and stored as sparse 4x4 matrix. |
|                 | *ReFlex.Core.Common*                   | Definitions of base data types used in the framework                                                                                                                                                                                                                                                                       |
|                 | *ReFlex.Core.Events*                   | Generic events used in the framework                                                                                                                                                                                                                                                                                       |
|                 | *ReFlex.Core.Filtering*                | Depth Image filter implementations.  Filters can be applied in any order.                                                                                                                                                                                                                                                  |
|                 | *ReFlex.Core.Graphics*                 | Definitions of base data types used in the framework                                                                                                                                                                                                                                                                       |
|                 | *ReFlex.Core.Implementation*           | Manager classes for the relevant Processing stages (Calibration, Tracking, Filtering, InteractionProcessing, Networking)                                                                                                                                                                                                   |
|                 | *ReFlex.Core.Interactivity*            | Defines Base Type for Interaction. Implementations for Single- and Multi-Touch Detection                                                                                                                                                                                                                                   |
|                 | *ReFlex.Core.Networking*               | common interfaces for client / server for network broadcasting and receiving *Interactions*, Reference implementations for Tcp client/server, Websocket communication                                                                                                                                                      |
|                 | *ReFlex.Core.Tracking*                 | common interface (__IDepthCamera__) for different Camera Types (description, current state, initialization, query configurations, start/stop streaming, events for frame updates)                                                                                                                                          |
|                 | *ReFlex.Core.Tuio*                     | Implementation of TUIO Protocol                                                                                                                                                                                                                                                                                            |
|                 | *ReFlex.Core.Util*                     | .NET specific utility functions (Logging/Threading)                                                                                                                                                                                                                                                                        |
| __Sensor__      |                                        | __IDepthCamera implementations for specific Depth sensors__                                                                                                                                                                                                                                                                |
|                 | *ReFlex.Sensor.TrackingImplementation* | projects for specific sensors (see [Sensor Modules](#sensor-modules))                                                                                                                                                                                                                                                      |
| __Legacy Apps__ |                                        | legacy applications for development (deprecated)                                                                                                                                                                                                                                                                           |
|                 | *ReFlex.Utilities.ConsoleClientDemo*   | Tutorial console app for showcasing network communication.                                                                                                                                                                                                                                                                 |
|                 | *ReFlex.Utilities.ConsoleServerDemo*   | Tutorial console app simulating a TCP-Server Instance sending *Interactions* for showcasing network communication                                                                                                                                                                                                          |
|                 | *ReFlex.Utilities.MouseInputConverter* | Converts interactions to mouse events for controlling normal apps/controls with DepthTouch (Windows only)                                                                                                                                                                                                                  |
|                 | *ReFlex.Frontend.ServerWPF*            | Server app for controlling sensor properties, calibration, filtering and broadcasting *Interactions*.  (__WPF__, Windows only).                                                                                                                                                                                            |

## Sensor Modules

implemented Sensor-Hardware

* Intel RealSense R2 (*RealSenseR2Module*)
* Intel RealSense D435 (*RealSenseD435Module*)
* Intel RealSense L515 (*RealSenseL515Module*)
* Microsoft Kinect 2 (*Kinect2Module*)
* Microsoft Azure Kinect (*AzureKinectModule*)

Software-Emulator:

* Emulator (*EmulatorModule*)

## Specific components

### Filter

Algorithms to process raw depth image for smoothing and mapping.
* cf. [Wiki_Filter]

#### BoxFilter

Smoothing depth image based on Box-Filter algorithm.  
Parameters: 

* __Radius__: determine the strength of the smoothing  

#### CalibrationFilter

Map depth coordinates (x,y) to screen coordinates based on given calibration matrix. (simnplke transfomation: scale + translate)  
Parameters:  

* __Calibration__: 2x2 Matrix to be multiplied with depth value to retrieve corresponding screen coordinate 

#### GaussianFilter

Separated two pass (X, then Y) smoothing algorithm based on gaussian blur.  
Parameters:  

* __Radius__: determine the strength of the smoothing  

#### LimitationFilter

removes tracking values outside of desirted viewing frame (e.g. interactive surface)  
Parameters:  

* __LeftBound__: left border, values with lower x-index willl be removed  
* __RighBound__: right border, values with higher x-index willl be removed  
* __UpperBound__: top border, values with lower y-index willl be removed  
* __LowerBound__: bottom border, values with higher y-index willl be removed  

#### ThresholdFilter  

Filters values which inner z-values are greater than a specified threshold. (== Limitation Filter in z-direction)  
Parameters:  

* __Threshold__: max absolute distance from display plane, depth vaues with a distance larger than this value are removed  

#### ValueFilter

removes depth values with specific value from depth image (e.g. remove all zeros)
Parameters:  

* __X__,__Y__,__Z__: values for filtering: depth value of [x,y,z] is removed 

## Code Examples

### TCP-Client

Basic code example to create a tcp-based client and listen to events from server (cf. *ReFlex.Utilities.ConsoleClientDemo/Client.cs*)

``` C#

public class Client
{ 
    // create new TCP-Client
    private readonly IClient _client = new TcpClient();

    public Client()
    {
        // attach to DataReceivedEvent and start listening to address 
        _client.NewDataReceived += HandleDataReceived;
        Run("localhost", 8080);
    }

    // handle events and parse messages from tracking server
    private void HandleDataReceived(object sender, Message message)
    {
        if (message?.MessageString == null)
            return;

        // retrieve list of interactions
        var interactions = SerializationUtils.DeserializeFromJson<List<Interaction>>(message.MessageString);
        
        // iterate over interactions
        interactions.ForEach(interaction =>
        {
            // get time of interaction
            var timeString = DateTime.FromFileTimeUtc(interaction.Time).ToShortTimeString();

            // ... do something        
        });
    }

    public void Run(string address, int port)
    {
        // connect if client is properly initialized
        _client?.Connect(address, port);  
    }

    public void Stop()
    {
        _client?.Disconnect();
    }
}
```

## Configurable Clients (TCP/WebSockets)

* cf. `ReFlex.Utilities.ConsoleClientDemo`/ `ReFlex.Utilities.ConsoleServerDemo` 
* both programs can be configured using the included `app.config`:

```XML
<?xml version="1.0" encoding="utf-8" ?>
<configuration>
  <appSettings>
    <add key="NetworkInterface" value="Http"/>
    <add key="Address" value="127.0.0.1"/>
    <add key="Port" value="40000"/>
    <add key="Endpoint" value="/ReFlex"/>

    <!-- values for TCP -->
    <!--<add key="NetworkInterface" value="tcp"/>
    <add key="Address" value="127.0.0.1"/>
    <add key="Port" value="8080"/>
    <add key="Endpoint" value=""/>-->
  </appSettings>
</configuration>
```

* by default (using the values above), Websocket connection is establishjed at address `ws://127.0.0.1/ReFlex`, TCP connection via `127.0.0.1:8080`;
* Testing websocket connections can easily be done by using the included HTML template in `src\Utilities\WebSocketTestHtml` (`launch.json` for Chrome debugging using VS code is included).

[Wiki_Filter]: https://de.wikipedia.org/wiki/Rekonstruktionsfilter "Filter_explanations"
