using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Networking.Util;
using ReFlex.Core.Tracking.Interfaces;
using ReFlex.Core.Tracking.Util;

namespace ReFlex.Sensor.EmulatorModule
{
    public class ImageBasedEmulatorCamera : IDepthCamera
    {
        #region Fields

        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
        private readonly string _address;

        private bool _isStarted;
        private StreamParameter _selectedConfig;
        private EmulatedPointCloud _pointCloud;

        #endregion
        #region Properties

        public string Id => _address;

        public string ModelDescription => $"Image-Based Emulator [{_address}]";

        public CameraType CameraType => CameraType.Emulator;

        public DepthCameraState State
        {
            get
            {
                return _isStarted ? DepthCameraState.Streaming : DepthCameraState.Connected;
            }
        }

        public StreamParameter StreamParameter { get; private set; }

        #endregion

        #region Events

        public event EventHandler<DepthCameraState> StateChanged;
        public event EventHandler<DepthCameraFrame> FrameReady;
        public event EventHandler<ImageByteArray> DepthImageReady;

        #endregion

        #region Constructor

        public ImageBasedEmulatorCamera(string address)
        {
            _address = address;
        }

        #endregion

        public void EnableStream(StreamParameter parameter)
        {
            _selectedConfig = GetPossibleConfigurations().FirstOrDefault(item => item.Width == parameter.Width && item.Height == parameter.Height && item.Framerate == parameter.Framerate);

            var param = new EmulatorParameters
            {
                HeightInMeters = 1.6f,
                WidthInMeters = 2.4f,
                MaxDepthInMeter = 2.1f,
                MinDepthInMeter = 0.8f,
                PlaneDistanceInMeter = 1.45f,
                Radius = (int)(parameter.Width * 0.4)
            };

            StreamParameter = parameter;

            _pointCloud = new EmulatedPointCloud(param);
            _pointCloud.InitializePointCloud(parameter);
        }

        public IList<StreamParameter> GetPossibleConfigurations()
        {
            var configs = new List<StreamParameter>
            {
                new StreamParameter(50, 50, 30),
                new StreamParameter(64, 36, 30),
                new StreamParameter(64, 48, 30),
                new StreamParameter(100, 100, 30),
                new StreamParameter(128, 72, 30),
                new StreamParameter(128, 96, 30),
                new StreamParameter(640, 480, 30),
                new StreamParameter(800, 600, 30),
                new StreamParameter(1920, 1080, 30),
                new StreamParameter(2560, 1440, 30)
            };

            return configs;
        }

        public void Initialize()
        {
            throw new NotImplementedException();
        }

        public void StartStream()
        {
            _isStarted = true;
            StateChanged?.Invoke(this, State);
        }

        public void StopStream()
        {
            _isStarted = false;
            StateChanged?.Invoke(this, State);
        }

        public void Update(byte[] data)
        {
            if (_isStarted && _selectedConfig != null)
            {
                var args = new ImageByteArray(
                    data,
                    _selectedConfig.Width,
                    _selectedConfig.Height,
                    3,
                    1);

                _pointCloud.Reset();
                _pointCloud.UpdateFromGreyScaleImage(args);

                DepthImageReady?.Invoke(this, args);
                FrameReady?.Invoke(this, new DepthCameraFrame { Depth = _pointCloud.Points });
            }

        }
    }
}
