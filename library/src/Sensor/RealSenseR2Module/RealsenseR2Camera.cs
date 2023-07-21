using System;
using System.Collections.Generic;
using NLog;
using Prise.Plugin;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Tracking.Interfaces;
using ReFlex.Core.Tracking.Util;

namespace ReFlex.Sensor.RealSenseR2Module
{
    /// <inheritdoc />
    /// <summary>
    /// The Intel Realsense r200 camera.
    /// </summary>
    /// <seealso cref="IDepthCamera" />
    [Plugin(PluginType = typeof(IDepthCamera))]
    public class RealsenseR2Camera : IDepthCamera
    {
        #region fields

        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        private PXCMSenseManager _senseManager;
        private PXCMCapture.Device _device;

        private PXCMPoint3DF32[] _vertices;
        private Point3[] _convertedVertices;

        private DepthCameraState _state;
        private DepthCameraFrame _frame;

        #endregion

        #region properties

        /// <inheritdoc />
        /// <summary>
        /// Gets the identifier.
        /// </summary>
        /// <value>
        /// The identifier.
        /// </value>
        public string Id => _device?.deviceInfo.didx.ToString();

        /// <inheritdoc />
        /// <summary>
        /// Gets the model parameter.
        /// </summary>
        /// <value>
        /// The model parameter.
        /// </value>
        public string ModelDescription => "Intel\u00A9 RealSense R2";

        public CameraType CameraType => CameraType.RealSenseR2;

        /// <inheritdoc />
        /// <summary>
        /// Gets the <see cref="DepthCameraState" />.
        /// </summary>
        /// <value>
        /// The camera state.
        /// </value>
        public DepthCameraState State
        {
            get => _state;
            private set
            {
                if (_state == value)
                    return;

                _state = value;
                OnStateChanged(this, _state);
                //LoggerUtils.Logger.Info("The camera-state changed to " + _state);
            }
        }

        /// <inheritdoc />
        /// <summary>
        /// Gets the configuration.
        /// </summary>
        /// <value>
        /// The configuration.
        /// </value>
        public StreamParameter StreamParameter { get; private set; }

        #endregion

        #region events

        /// <inheritdoc />
        /// <summary>
        /// Occurs when [state changed].
        /// </summary>
        public event EventHandler<DepthCameraState> StateChanged;

        /// <inheritdoc />
        /// <summary>
        /// Occurs when [frame ready].
        /// </summary>
        public event EventHandler<DepthCameraFrame> FrameReady;
        
        ///<inheritdoc/>
        /// <summary>
        /// Not implemented !
        /// </summary>
        public event EventHandler<ImageByteArray> DepthImageReady;

        #endregion

        #region constructor

        /// <summary>
        /// Initializes a new instance of the <see cref="RealsenseR2Camera"/> class.
        /// </summary>
        public RealsenseR2Camera()
        {
            State = DepthCameraState.Disconnected;
        }

        #endregion

        #region methods

        /// <inheritdoc />
        /// <summary>
        /// Initializes this instance.
        /// </summary>
        public void Initialize()
        {
            try
            {
                _senseManager = PXCMSenseManager.CreateInstance();
                _frame = new DepthCameraFrame();
            }
            catch (Exception e)
            {
                Logger.Error(e);
            }

        }

        /// <inheritdoc />
        /// <summary>
        /// Enables one streamtype.
        /// </summary>
        /// <param name="parameter">The parameter for the stream.</param>
        /// <exception cref="ArgumentOutOfRangeException"></exception>
        public void EnableStream(StreamParameter parameter)
        {
            Initialize();
            StreamParameter = parameter;
            var state = pxcmStatus.PXCM_STATUS_NO_ERROR;

            try
            {
                state += (int)_senseManager.EnableStream(PXCMCapture.StreamType.STREAM_TYPE_DEPTH,
                    parameter.Width, parameter.Height, parameter.Framerate);
            }
            catch (Exception exception)
            {
                Logger.Error(exception);
            }

            if (state < pxcmStatus.PXCM_STATUS_NO_ERROR)
                State = DepthCameraState.Error;

            var handler = new PXCMSenseManager.Handler();
            handler.onConnect += OnConnected;
            handler.onNewSample += OnNewSample;

            if (_senseManager == null)
            {
                State = DepthCameraState.Error;
                return;
            }

            State = _senseManager.Init(handler) >= pxcmStatus.PXCM_STATUS_NO_ERROR
                ? DepthCameraState.Connected : DepthCameraState.Error;
        }

        /// <inheritdoc />
        /// <summary>
        /// Gets the possible configurations.
        /// </summary>
        /// <returns>
        /// A List of possible configuratiions.
        /// </returns>
        public IList<StreamParameter> GetPossibleConfigurations()
        {
            var configs = new List<StreamParameter>
            {
                new StreamParameter(320, 240, 30),
                new StreamParameter(320, 240, 60),
                new StreamParameter(480, 360, 30),
                new StreamParameter(480, 360, 60),
                new StreamParameter(628, 468, 30),
                new StreamParameter(628, 468, 60)
            };

            return configs;
        }

        /// <inheritdoc />
        /// <summary>
        /// Starts the stream.
        /// </summary>
        public void StartStream()
        {
            if (State == DepthCameraState.Connected)
                State = _senseManager.StreamFrames(false) >= pxcmStatus.PXCM_STATUS_NO_ERROR
                    ? DepthCameraState.Streaming : DepthCameraState.Error;
        }

        /// <inheritdoc />
        /// <summary>
        /// Stops the stream.
        /// </summary>
        public void StopStream()
        {
            State = DepthCameraState.Disconnected;
            _senseManager?.Close();
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

        /// <summary>
        /// Called when [connected].
        /// </summary>
        /// <param name="device">The device.</param>
        /// <param name="connected">if set to <c>true</c> [connected].</param>
        /// <returns></returns>
        private pxcmStatus OnConnected(PXCMCapture.Device device, bool connected)
        {
            if (connected)
            {
                _device = device;
                return pxcmStatus.PXCM_STATUS_NO_ERROR;
            }

            State = DepthCameraState.Disconnected;
            _device = null;
            return pxcmStatus.PXCM_STATUS_DEVICE_LOST;
        }

        /// <summary>
        /// Called when [new sample].
        /// </summary>
        /// <param name="mid">The mid.</param>
        /// <param name="sample">The sample.</param>
        /// <returns></returns>
        private pxcmStatus OnNewSample(int mid, PXCMCapture.Sample sample)
        {
            if (sample.depth != null)
            {
                _frame.Depth = ConvertVertices(GetVertices(sample));
            }

            OnFrameReady(this, _frame);

            return pxcmStatus.PXCM_STATUS_NO_ERROR;
        }

        /// <summary>
        /// Gets the vertices.
        /// </summary>
        /// <param name="sample">The sample.</param>
        /// <returns></returns>
        private PXCMPoint3DF32[] GetVertices(PXCMCapture.Sample sample)
        {
            var depthImage = sample.depth;
            var frameSize = depthImage.info.width * depthImage.info.height;
            if (_vertices == null || _vertices.Length != frameSize)
                _vertices = new PXCMPoint3DF32[frameSize];

            var projection = _device.CreateProjection();
            projection.QueryVertices(depthImage, _vertices);

            return _vertices;
        }

        /// <summary>
        /// Converts the vertices.
        /// </summary>
        /// <param name="source">The source.</param>
        /// <returns></returns>
        private Point3[] ConvertVertices(IReadOnlyList<PXCMPoint3DF32> source)
        {
            if (_convertedVertices?.Length != source.Count)
                ArrayUtils.InitializeArray(out _convertedVertices, source.Count);

            for (var i = 0; i < source.Count; ++i)
            {
                ToPoint3(source[i], ref _convertedVertices[i]);
            }

            return _convertedVertices;
        }

        /// <summary>
        /// To the point3.
        /// </summary>
        /// <param name="source">The source.</param>
        /// <param name="target">The target.</param>
        public static void ToPoint3(PXCMPoint3DF32 source, ref Point3 target)
            => target.Set(source.x / 1000, source.y / 1000, source.z / 1000);

        #endregion
    }
}
