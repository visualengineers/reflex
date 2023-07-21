using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Intel.RealSense;
using NLog;
using Prise.Plugin;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Tracking.Interfaces;
using ReFlex.Core.Tracking.Util;

namespace ReFlex.Sensor.RealSenseD435Module
{
    [Plugin(PluginType = typeof(IDepthCamera))]
    public class RealsenseD435Camera : IDepthCamera
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        private Pipeline _pipeline;
        private PipelineProfile _profile;
        private Config _config;

        private DepthCameraState _state;
        private DepthCameraFrame _frame;

        private CancellationTokenSource _cancellationTokenSource;

        public string Id => "D435_Id_Placeholder";

        public string ModelDescription => "Intel\u00A9 RealSense D435";

        public CameraType CameraType => CameraType.RealSenseD435;

        public DepthCameraState State
        {
            get => _state;
            private set
            {
                if (_state == value)
                    return;

                _state = value;
                OnStateChanged(this, _state);
            }
        }

        public StreamParameter StreamParameter { get; private set; }

        public event EventHandler<DepthCameraState> StateChanged;

        public event EventHandler<DepthCameraFrame> FrameReady;

        ///<inheritdoc/>
        /// <summary>
        /// Not implemented !
        /// </summary>
        public event EventHandler<ImageByteArray> DepthImageReady;

        public RealsenseD435Camera()
        {
            State = DepthCameraState.Disconnected;
        }

        public void Initialize()
        {
            _pipeline = new Pipeline();
            _frame = new DepthCameraFrame();
            _cancellationTokenSource = new CancellationTokenSource();

            State = QueryDevices();
        }

        public void EnableStream(StreamParameter parameter)
        {
            Initialize();
            StreamParameter = parameter;

            _config = new Config();
            _config.EnableStream(Stream.Depth, 0, parameter.Width, parameter.Height, Format.Z16, parameter.Framerate);

        }

        public IList<StreamParameter> GetPossibleConfigurations()
        {
            var configs = new List<StreamParameter>
            {
                new StreamParameter(424, 240, 15),
                new StreamParameter(480, 270, 15),
                new StreamParameter(640, 360, 15),
                new StreamParameter(640, 480, 90),
                new StreamParameter(848, 100, 100),
                new StreamParameter(848, 480, 90),
                new StreamParameter(1280, 720, 30)
            };

            return configs;
        }

        public void StartStream()
        {
            if (QueryDevices() != DepthCameraState.Connected || _pipeline == null)
                return;

            _profile = _pipeline.Start(_config);
            var selectedDevice = _profile.Device;
            var depthSensor = selectedDevice.Sensors[0];

            if (depthSensor.Options.Supports(Option.EmitterEnabled))
                depthSensor.Options[Option.EmitterEnabled].Value = 1f; // Enable emitter

            if (depthSensor.Options.Supports(Option.LaserPower))
            {
                var laserPower = depthSensor.Options[Option.LaserPower];
                laserPower.Value = laserPower.Max; // Set max power
            }

            State = DepthCameraState.Streaming;
            var pointCloudProcessor = new PointCloud();

            const int capacity = 5; // allow max latency of 5 frames
            var queue = new FrameQueue(capacity);

            var cancellationToken = _cancellationTokenSource.Token;

            Task.Run(() =>
            {
                while (true)
                {
                    if (cancellationToken.IsCancellationRequested)
                        break;

                    if (!queue.PollForFrame(out DepthFrame frame)) continue;

                    using (frame)
                    using (var points = pointCloudProcessor.Process(frame).As<Points>())
                    {
                        var vertices = new float[points.Count * 3];
                        points.CopyVertices(vertices);
                        _frame.Depth = ConvertVertices(vertices);
                        OnFrameReady(this, _frame);
                    }
                }
            }, cancellationToken);

            Task.Run(() =>
            {
                while (true)
                {
                    if(cancellationToken.IsCancellationRequested)
                        break;

                    var success = _pipeline.TryWaitForFrames(out var frames);
                    if (!success || frames == null)
                        continue;
                    using (var depth = frames.DepthFrame)
                        queue.Enqueue(depth);
                }
            }, cancellationToken);
        }

        public void StopStream()
        {
            if (State >= DepthCameraState.Connected)
            {
                _cancellationTokenSource?.Cancel();

                var selectedDevice = _profile.Device;
                var depthSensor = selectedDevice.Sensors[0];

                if (depthSensor.Options.Supports(Option.EmitterEnabled))
                    depthSensor.Options[Option.EmitterEnabled].Value = 1f; // Enable emitter

                if (depthSensor.Options.Supports(Option.LaserPower))
                {
                    var laserPower = depthSensor.Options[Option.LaserPower];
                    laserPower.Value = 0f; // Disable laser
                }

                _pipeline?.Stop();
            }

            State = DepthCameraState.Disconnected;
        }

        private DepthCameraState QueryDevices()
        {
            var ctx = new Context();
            var list = ctx.QueryDevices(); // Get a snapshot of currently connected devices
            if (list.Count == 0)
            {
                Logger.Warn($"{ModelDescription}: No device detected. Is it plugged in?");
            }

            return list.Count > 0 ? DepthCameraState.Connected : DepthCameraState.Disconnected;
        }

        private Point3[] ConvertVertices(IReadOnlyList<float> source)
        {
            var converted = new Point3[source.Count / 3];

            for (var i = 0; i < source.Count; i += 3)
                converted[i / 3] = new Point3(source[i], source[i + 1], source[i + 2]);

            return converted;
        }

        protected virtual void OnFrameReady(object sender, DepthCameraFrame frame) =>
            FrameReady?.Invoke(sender, frame);

        protected virtual void OnStateChanged(RealsenseD435Camera realsenseD435Camera, DepthCameraState state) =>
            StateChanged?.Invoke(realsenseD435Camera, state);
    }
}
