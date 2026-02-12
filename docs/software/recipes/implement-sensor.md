--- 

title: "ReFlex Library: How add a new sensor"

---

# {{ page.title }}

<img src="{{ site.baseurl}}/assets/img/titles/pointcloud.png" class="content__title-image" alt="title image showing a pointcloud representation of two hands deforming the surface"/>

<!-- omit in toc-->
## Table of Contents

1. [Table of Contents](#table-of-contents)
2. [General approach](#general-approach)
3. [The `IDepthCamera` Interface](#the-idepthcamera-interface)
4. [Example Implementation: `AzureKinectCamera`](#example-implementation-azurekinectcamera)
5. [Registering the Sensor with `CameraManager`](#registering-the-sensor-with-cameramanager)

## General approach

* Depth sensors must implement the interface `IDepthCamera` in the namespace `ReFlex.Core.Tracking.Interfaces`
* By convention Sensor Implementations *should* be placed in a separate project in `Library/src/Sensor` (.NET Solution Structure: ReFlex/Sensor/)
* That project should contain the references to sensor-related libraries / packages
* To preserve modularity, these references should be only added to the camera project
* for more details: cf. [IDepthCamera interface](#the-idepthcamera-interface)

* The implementation of the `IDepthCamera` needs to be registered with the `CameraManager` in the `TrackingServer.Model` namespace (project: `ReFlex.TrackingServer`)
* camera reference needs to be placed inside the `!NO_EXTERNAL_SENSORS` preprocessor switch. this ensures that tests can be run when sensors and related drivers/references are not available (e.g. in CI Pipeline).
* The same is valid for registering the sensor in the constructor of the `CameraManager`
* sensors that do not require external dependencies (e.g. software-emulator, ... ) can ignore this rule
* if a sensor should be constrained to be available on a specific platform only, the check `RuntimeInformation.IsOSPlatform()` can be used
* for more information, see [Registering the Sensor](#registering-the-sensor-with-cameramanager)

__[⬆ back to top](#table-of-contents)__

## The `IDepthCamera` Interface

| Method / Property                       | Description                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Id                                      | unique identifier, used to select the sensor. (`string`, readonly)                                        |
| CameraType                              | Enumeration of different Camera types, used to distinguish between physical camera and software-emulated  |
| ModelDescription                        | description of the sensor for server frontend (`string`, readonly)                                        |
| State                                   | `DepthCameraState` for checking current state of the sensor (readonly, should be set by the sensor itself |
| StreamParameter                         | description for currently active sensor mode (resolution, framerate, image format)                        |
| StateChanged                            | `event` which should be triggered, when the camera state changes                                          |
| FrameReady                              | `event` which should be triggered, to broadcast an updated point cloud                                    |
| DepthImageReady                         | `event` which should be triggered, to broadcast the raw depth image as byte array                         |
| Initialize()                            | Code for initial setup of the sensor (checking availability, etc.)                                        |
| GetPossibleConfigurations()             | returns the list of available                                                                             |
| EnableStream(StreamParameter parameter) | returns list of available sensor modes                                                                    |
| StartStream()                           | starts tracking with the previously set configuration                                                     |
| StopStream()                            | stops tracking                                                                                            |
| Dispose()                               | cleanup code when the app is stopped (e.g. stop sensor and free resources)                                |

__[⬆ back to top](#table-of-contents)__

## Example Implementation: `AzureKinectCamera`

{% highlight csharp linenos %}

    [Plugin(PluginType = typeof(IDepthCamera))]
    public class AzureKinectCamera : IDepthCamera, IDisposable
    {
        // private fields
        
        private const int BytesPerChannel = sizeof(ushort);
        private const int NumChannels = 3;

        private readonly Device _device;

        private DepthCameraState _state;

        private bool _queryDepth;
        private Transformation _transform;

        private byte[] _transformedPixels;
        private Point3[] _convertedVertices;

        // Properties

        public string Id => _device?.SerialNum;

        public CameraType CameraType => CameraType.AzureKinect;

        public string ModelDescription => "Microsoft\u00A9 Azure Kinect";

        public DepthCameraState State
        {
            get => _state;
            private set
            {
                if (_state == value) return;

                _state = value;
                OnStateChanged(this, _state);
            }
        }
        public StreamParameter StreamParameter { get; private set; }

        // events

        public event EventHandler<DepthCameraState> StateChanged;

        public event EventHandler<ImageByteArray> DepthImageReady;

        public event EventHandler<DepthCameraFrame> FrameReady;

        // Constructor

        public AzureKinectCamera()
        {
            var numDevicesAvailable = Device.GetInstalledCount();
            _device = Device.Open();
            State = numDevicesAvailable > 0
                ? DepthCameraState.Connected
                : DepthCameraState.Disconnected;
        }

        // Methods

        public void Initialize()
        {
            var numDevicesAvailable = Device.GetInstalledCount();

            if (numDevicesAvailable <= 0) {
                State = DepthCameraState.Error;
            }
        }

        public void EnableStream(StreamParameter parameter)
        {
            StreamParameter = parameter;
        }

        public IList<StreamParameter> GetPossibleConfigurations()
        {
            return AzureKinectStreamParameterConverter.GetSupportedConfigurations();
        }

        public void StartStream()
        {
            var deviceConfiguration = new DeviceConfiguration
            {
                CameraFPS = AzureKinectStreamParameterConverter.GetFps(StreamParameter),
                ColorResolution = ColorResolution.Off,
                DepthMode = AzureKinectStreamParameterConverter.GetDepthMode(StreamParameter)
            };

            _device.StartCameras(deviceConfiguration);
            _transform = _device.GetCalibration().CreateTransformation();

            ArrayUtils.InitializeArray(out _transformedPixels, StreamParameter.Width * StreamParameter.Height * NumChannels * 2);
            ArrayUtils.InitializeArray(out _convertedVertices, StreamParameter.Width * StreamParameter.Height);

            State = DepthCameraState.Streaming;

            _queryDepth = true;

            Task.Run(QueryDepthStream);
        }

        public void StopStream()
        {
            _queryDepth = false;

            if (_device == null)
                return;

            _device.StopCameras();

            State = DepthCameraState.Connected;
        }
        
        public void Dispose()
        {
            _transform?.Dispose();
            _device?.Dispose();
        }

        // ... implementation details omitted 

    }

{% endhighlight %}

__[⬆ back to top](#table-of-contents)__

## Registering the Sensor with `CameraManager`

To make camera available in the server, the module must be registered in the `CameraManager` of `ReFlex.TrackingServer`.

**Example Code**:

{% highlight csharp linenos %}

    using NLog;
    using ReFlex.Core.Tracking.Interfaces;
    using ReFlex.Sensor.EmulatorModule;
    #if !NO_EXTERNAL_SENSORS
    using System.Runtime.InteropServices;
    using ReFlex.Sensor.AzureKinectModule;
    using ReFlex.Sensor.Kinect2Module;
    using ReFlex.Sensor.RealSenseD435Module;
    using ReFlex.Sensor.RealSenseL515Module;
    using ReFlex.Sensor.RealSenseR2Module;
    // place reference to new camera module here
    #endif

    namespace TrackingServer.Model
    {        
        public class CameraManager

        // ...

        public CameraManager()
        {

         _depthCameras = new List<IDepthCamera>();

            #if !NO_EXTERNAL_SENSORS

                try
                {
                    // register your new camera:
                    var myCustomCam = new CustomDepthSensor();
                    _depthCameras.Add(myCustomCam);
                    Logger.Info($"Successfully loaded {myCustomCam.ModelDescription} camera.");
                }
                catch (Exception exception)
                {
                    Logger.Error(exception);
                }

                // ...

            #endif
        }
    }

{% endhighlight %}

__[⬆ back to top](#table-of-contents)__
