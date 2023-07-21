# ReFlex.Library

Core Library for Development of applications for __Elastic Displays__. Created in context of research project __ZELASTO__ (EFRE-project no. 100376687) in cooperation with HTW Dresden. 

## Project setup
### Frameworks 
* __.NET 4.8__ (Sensor.TrackingImplementation, FrontEnd.ServerWPF) - *Windows only*
* __.NET Standard 2.0__ (Core.*)
* __.NET Core 3.0__ (Utilities.*)

### IDE
* Visual Studio 2019 (Ultimate)
* recomnmended: ReSharper

### nuget Packages
#### general

* __Newtonsoft.JSon v12.0__  
  JSON-Serializer
* __NLog v4.6__  
  Universal logging framework for .NET
* __SharpGL v2.4__  
  OpenGL Wrapper for WPF - used to visualize vectors in TrackingServer
* __SimpleTCP v1.0__  
  TCP library for .NET
* __websocketsharp.core v1.0__  
  .net standard library for using web sockets


#### WPF/XAML
* __CalcBinding v2.5__  
  support calculations in Binding expressions for WPF XAML
* __MahApps v2.0.0 (alpha)__  
  UI lib for WPF (.NET Core compatibility starting from v2.0)
* __Prism v7.2__  
  .NET DI framework
* __Unity v5.1__  
  Container for Prism  


## Project Structure

* __Core__  
  Contains base functionality of DepthSensing Framework. Platform-independent .NET Standard libraries.
  * *ReFlex.Core.Calibration*  
    Implementation of semi-automatic mapping algorithm. Based on three linear-independent reference points the associated points in the depth image have to be specified. From this relative transformation a linear transformation in XY-Plane (Translate, scale, rotate, shear) is computed and stored as sparse 4x4 matrix.
  * *ReFlex.Core.Common*  
    Definitions of base data types used in the framework
  * *ReFlex.Core.Filtering*  
    Depth Image filter implementations.  
    Filters can be applied in any order.
  * *ReFlex.Core.Interactivity*  
    Defines Base Type for Interaction  
    Implementations for Single- and Multi-Touch Detection
  * *ReFlex.Core.Networking*  
    common interfaces for client / server for network broadcasting and receiving *Interactions*  
    Reference implementations for 
      - TCP Client and Server  
      - WebSocket Server
  * *ReFlex.Core.Tracking*  
    common interface (__IDepthCamera__) for different Camera Types:
      - description
      - current state
      - initialization 
      - query configurations  
      - start/stop stream
      - events for frame updates      
  * *ReFlex.Core.Util*   
    .NET specific utility functions (Logging/Threading)* 
* __Sensor__  
  IDepthCamera implementations for specific Depth sensors.
  * *ReFlex.Sensor.TrackingImplementation*  
    *currently supported:*  
      - Intel RealSense D200
      - Intel RealSense D435 
      - Microsoft Kinect 2
* __Utilities__  
  Helper applications for development  
  * *ReFlex.Utilities.ConsoleClientDemo*  
  Tutorial console app for showcasing network communication.
  * *ReFlex.Utilities.ConsoleServerDemo*  
  Tutorial console app simulating a TCP-Serv Instance sending *Interactions* for showcasing network communication
  * *ReFlex.Utilities.MouseInputConverter*  
  Converts interactions to mouse events for controlling normal apps/controls with DepthTouch (Windows only ?)
* __Frontend__
  * *ReFlex.Frontend.ServerWPF*  
  Server app for controlling sensor proteries, calibration, filtering and broadcasting *Interactions*.  (__WPF__).

![alt_text][TrackingServer01] ![alt_text][TrackingServer02] ![alt_text][TrackingServer03] ![alt_text][TrackingServer04]
      

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

### Issues / TODOs
#### general
* add UE4-Plugin to repository
#### Library
* move base types (e.g. __Interaction__) and Interfaces into core lib
* Filter-performance, general performance, merge filters
* implement complete spatial calibration (--> see DeeP)
* restore/reimplement image-based automatic calibration
* move initialization code from tracking server to libraries

## Code Example

### Interactions Message Format (JSON)

``` JSON
[
    {
        "Position": {
            "X":492.98132,
            "Y":837.3649,
            "Z":-0.58860755,
            "IsValid":true
        },
        "Type":1,
        "Confidence":1.0,
        "Time":637166093838536173
    }
]

```

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

## Motivation

> A short description of the motivation behind the creation and maintenance of the project. This should explain **why** the project exists.

## Installation

> Provide code examples and explanations of how to get the project.

## API Reference

> Depending on the size of the project, if it is small and simple enough the reference docs can be added to the README. For medium size to larger projects it is important to at least provide a link to where the API reference docs live.

## Tests

> Describe and show how to run the tests with code examples.

## Contributors

> Let people know how they can dive into the project, include important links to things like issue trackers, irc, twitter accounts if applicable.

## License

> A short snippet describing the license (MIT, Apache, etc.)

[Wiki_Filter]: https://de.wikipedia.org/wiki/Rekonstruktionsfilter "Filter_explanations"

[TrackingServer01]: documentation/dSense_server_01_tracking.png "dSense Server - Tracking Options"
[TrackingServer02]: documentation/dSense_server_02_filter.png "dSense Server - Filtering Options"
[TrackingServer03]: documentation/dSense_server_03_processing.png "dSense Server - Options for detecting Interactions"
[TrackingServer04]: documentation/dSense_server_04_network.png "dSense Server - Network Options"