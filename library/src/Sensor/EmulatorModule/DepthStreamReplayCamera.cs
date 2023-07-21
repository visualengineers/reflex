using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Networking.Util;
using ReFlex.Core.Tracking.Interfaces;
using ReFlex.Core.Tracking.Util;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Advanced;
using SixLabors.ImageSharp.PixelFormats;

namespace ReFlex.Sensor.EmulatorModule
{
    public class DepthStreamReplayCamera : IDepthCamera
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
        private bool _isStarted;
        private int _numConfigs = 0;
        private bool _stopRequested;

        private EmulatedPointCloud _pointCloud;

        public string Id => "ReplayCamera";
        public CameraType CameraType { get; } = CameraType.Emulator;

        public string ModelDescription => Id;

        public DepthCameraState State =>
            _numConfigs == 0
                ? DepthCameraState.Disconnected
                : _isStarted
                    ? DepthCameraState.Streaming
                    : DepthCameraState.Connected;

        public StreamParameter StreamParameter { get; private set; }

        public event EventHandler<DepthCameraState> StateChanged;
        public event EventHandler<DepthCameraFrame> FrameReady;
        public event EventHandler<ImageByteArray> DepthImageReady;

        public void Initialize()
        {

        }

        public void EnableStream(StreamParameter parameter)
        {
            if (_isStarted)
                StopStream();

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
            var result = RecordingUtils.RetrieveConfigurations().ToList();

            _numConfigs = result.Count;

            return result;
        }

        public void StartStream()
        {
            if (StreamParameter == null || State != DepthCameraState.Connected)
            {
                Logger.Log(LogLevel.Error, $"Cannot start {GetType().Name}: incorrect configuration.");
                return;
            }

            if (_isStarted)
            {
                StopStream();
                Task.Delay(TimeSpan.FromMilliseconds(500));
            }

            var delay = 1000 / StreamParameter.Framerate;

            _isStarted = true;

            StateChanged?.Invoke(this, State);

            Task.Run(() => Stream(RecordingUtils.GetFrames(StreamParameter.Name), delay, StreamParameter.Width, StreamParameter.Height, StreamParameter.Format));
        }

        public void StopStream()
        {
            if (!_isStarted)
            {
                StateChanged?.Invoke(this, State);
                return;
            }

            _stopRequested = true;
        }

        private void Stream(IReadOnlyList<string> frames, int delay, int width, int height, DepthImageFormat format)
        {
            var i = 0;

            while (i < frames?.Count && !_stopRequested)
            {
                switch (format)
                {
                    case DepthImageFormat.Greyccale48bpp:
                        ConvertImage<Rgb48>(frames[i], width, height, format);
                        break;
                    case DepthImageFormat.Greyscale8bpp:
                        ConvertImage<L8>(frames[i], width, height, format);
                        break;
                    case DepthImageFormat.Rgb24bpp:
                    default:
                        ConvertImage<Rgb24>(frames[i], width, height, format);
                        break;
                }

                Task.Delay(TimeSpan.FromMilliseconds(delay));

                i = i < frames?.Count - 1 ? i + 1 : 0;
                
            }

            _isStarted = false;

            StateChanged?.Invoke(this, State);

            _stopRequested = false;
        } 
        
        private void ConvertImage<T>(string file, int width, int height, DepthImageFormat format) where T : unmanaged, IPixel<T> {

            var img = Image.Load<T>(file);

            var size = GetSizePerPixel(format);

            var data = new byte[img.Width * img.Height * size];
            img.CopyPixelDataTo(data);

            var args = new ImageByteArray(data, width, height, DepthImageFormatTools.BytesPerChannel(format), DepthImageFormatTools.NumChannels(format), format);

            _pointCloud.Reset();
            _pointCloud.UpdateFromGreyScaleImage(args);

            DepthImageReady?.Invoke(this, args);
            FrameReady?.Invoke(this, new DepthCameraFrame { Depth = _pointCloud.Points });
            
        }
        
        private static int GetSizePerPixel(DepthImageFormat format)
        {
            switch (format)
            {
                case DepthImageFormat.Greyccale48bpp:
                    return Unsafe.SizeOf<Rgb48>();
                case DepthImageFormat.Rgb24bpp:
                    return Unsafe.SizeOf<Rgb24>();
                case DepthImageFormat.Greyscale8bpp:
                    return Unsafe.SizeOf<L8>();
                default:
                    return Unsafe.SizeOf<Rgba32>();
            }
        }
    }
}
