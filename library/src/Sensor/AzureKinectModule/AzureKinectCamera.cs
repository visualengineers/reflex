using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Azure.Kinect.Sensor;
using Prise.Plugin;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Tracking.Interfaces;
using ReFlex.Core.Tracking.Util;

namespace ReFlex.Sensor.AzureKinectModule
{
    [Plugin(PluginType = typeof(IDepthCamera))]
    public class AzureKinectCamera : IDepthCamera, IDisposable
    {
        #region Fields

        private const int BytesPerChannel = sizeof(ushort);
        private const int NumChannels = 3;

        private readonly Device _device;

        private DepthCameraState _state;

        private bool _queryDepth;
        private Transformation _transform;

        private byte[] _transformedPixels;
        private Point3[] _convertedVertices;

        #endregion

        #region Properties

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

        #endregion

        #region Events

        public event EventHandler<DepthCameraState> StateChanged;

        public event EventHandler<ImageByteArray> DepthImageReady;

        public event EventHandler<DepthCameraFrame> FrameReady;

        #endregion

        #region Constructor

        public AzureKinectCamera()
        {
            var numDevicesAvailable = Device.GetInstalledCount();
            _device = Device.Open();
            State = numDevicesAvailable > 0
                ? DepthCameraState.Connected
                : DepthCameraState.Disconnected;
        }

        #endregion

        #region public Methods

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

        #endregion

        #region private Methods

        private async void QueryDepthStream()
        {
            
                 

            while (_queryDepth)
            {
                using (var transformedDepth = new Image(
                    ImageFormat.Custom, StreamParameter.Width, StreamParameter.Height, StreamParameter.Width * BytesPerChannel  * NumChannels))
                using (var capture = await Task.Run(() => _device.GetCapture()))
                {
                    var depth = capture.Depth;
                    
                    _transform.DepthImageToPointCloud(depth, transformedDepth);

                    transformedDepth.Memory.ToArray().CopyTo(_transformedPixels, 0);

                    ConvertPixels();

                    var frame = new DepthCameraFrame
                    {
                        Depth = _convertedVertices
                    };

                    OnFrameReady(this, frame);

                    var args = new ImageByteArray(transformedDepth.Memory.ToArray(),
                        StreamParameter.Width, StreamParameter.Height, 
                        BytesPerChannel, NumChannels, DepthImageFormat.Greyccale48bpp);

                    DepthImageReady?.Invoke(this, args);
                }
            }
        }

        private void ConvertPixels()
        {
            for (var i = 0; i < StreamParameter.Width * StreamParameter.Height; i++)
            {
                var pos = i * 6;

                var pX = BitConverter.ToInt16(_transformedPixels, pos);
                var pY = BitConverter.ToInt16(_transformedPixels, pos + 2);
                var pZ = BitConverter.ToInt16(_transformedPixels, pos + 4);
                
                var point = new Point3(pX * 0.001f, pY * 0.001f, pZ * 0.001f);

                _convertedVertices.SetValue(point, i);
            }
        }

        /// <summary>
        /// Called when a new [frame ready].
        /// </summary>
        /// <param name="sender">The sender.</param>
        /// <param name="frame">The frame.</param>
        protected virtual void OnFrameReady(object sender, DepthCameraFrame frame) =>
            FrameReady?.Invoke(sender, frame);

        /// <summary>
        /// Called when [args changed].
        /// </summary>
        /// <param name="sender">The sender.</param>
        /// <param name="state">The args.</param>
        protected virtual void OnStateChanged(object sender, DepthCameraState state) =>
            StateChanged?.Invoke(sender, state);

        #endregion
    }
}
