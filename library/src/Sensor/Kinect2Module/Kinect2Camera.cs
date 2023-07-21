using System;
using System.Collections.Generic;
using Microsoft.Kinect;
using Prise.Plugin;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Tracking.Interfaces;
using ReFlex.Core.Tracking.Util;

namespace ReFlex.Sensor.Kinect2Module
{
    /// <inheritdoc />
    /// <summary>
    /// The Micosoft kinect 2 camera.
    /// </summary>
    /// <seealso cref="IDepthCamera" />
    [Plugin(PluginType = typeof(IDepthCamera))]
    public class Kinect2Camera : IDepthCamera
    {
        #region fields

        private KinectSensor _device;
        private MultiSourceFrameReader _multiFrameReader;

        private DepthCameraState _state;
        private DepthCameraFrame _frame;

        private ushort[] _depthPixelData;
        private CameraSpacePoint[] _vertices;
        private Point3[] _convertedVertices;

        #endregion

        #region properties

        /// <inheritdoc />
        /// <summary>
        /// Gets the identifier of the device.
        /// </summary>
        /// <value>
        /// The identifier of the device.
        /// </value>
        public string Id => _device?.UniqueKinectId;

        /// <inheritdoc />
        /// <summary>
        /// Gets the model parameter of the device.
        /// </summary>
        /// <value>
        /// The model parameter of the device.
        /// </value>
        public string ModelDescription => "Microsoft\u00A9 Kinect 2";

        public CameraType CameraType => CameraType.Kinect2;

        /// <inheritdoc />
        /// <summary>
        /// Gets the <see cref="DepthCameraState" /> of the device.
        /// </summary>
        /// <value>
        /// The camera args of the device.
        /// </value>
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

        /// <inheritdoc />
        /// <summary>
        /// Gets the stream parameters.
        /// </summary>
        /// <value>
        /// The stream parameter.
        /// </value>
        public StreamParameter StreamParameter { get; private set; }

        #endregion

        #region constructor

        /// <summary>
        /// Initializes a new instance of the <see cref="Kinect2Camera"/> class.
        /// </summary>
        public Kinect2Camera()
        {
            State = DepthCameraState.Disconnected;
            _multiFrameReader?.Dispose();

            Initialize();
        }

        #endregion

        #region events

        /// <inheritdoc />
        /// <summary>
        /// Occurs when an new [frame ready].
        /// </summary>
        public event EventHandler<DepthCameraFrame> FrameReady;


        ///<inheritdoc/>
        /// <summary>
        /// Not implemented !
        /// </summary>
        public event EventHandler<ImageByteArray> DepthImageReady;

        /// <inheritdoc />
        /// <summary>
        /// Occurs when the camera [args changed].
        /// </summary>
        public event EventHandler<DepthCameraState> StateChanged;

        #endregion

        #region methods

        /// <inheritdoc />
        /// <summary>
        /// Initializes this instance.
        /// </summary>
        public void Initialize()
        {
            var defaultDevice = KinectSensor.GetDefault();

            if (defaultDevice == null)
            {
                State = DepthCameraState.Error;
            }
            else
            {
                _device = defaultDevice;
                _device.IsAvailableChanged += OnAvailableChanged;
                _frame = new DepthCameraFrame();
            }
        }

        /// <inheritdoc />
        /// <summary>
        /// Enables one streamtype.
        /// </summary>
        /// <param name="parameter">The parameter for the stream.</param>
        public void EnableStream(StreamParameter parameter)
        {
            if (_device == null)
            {
                State = DepthCameraState.Error;
                return;
            }

            _multiFrameReader = _device.OpenMultiSourceFrameReader(FrameSourceTypes.Depth);
            UpdateDepthStreamDescription();

            if (_multiFrameReader == null)
            {
                State = DepthCameraState.Error;
                return;
            }

            _device.Open();
        }

        /// <inheritdoc />
        /// <summary>
        /// Starts the stream.
        /// </summary>
        public void StartStream()
        {
            if (_device.IsOpen)
            {
                _multiFrameReader.MultiSourceFrameArrived += OnMultiFrameArrived;
                State = DepthCameraState.Streaming;
            }
            else
            {
                State = DepthCameraState.Error;
            }
        }

        /// <summary>
        /// Called when [available changed].
        /// </summary>
        /// <param name="sender">The sender.</param>
        /// <param name="args">The <see cref="IsAvailableChangedEventArgs"/> instance containing the event data.</param>
        private void OnAvailableChanged(object sender, IsAvailableChangedEventArgs args)
        {
            State = args.IsAvailable ? State == DepthCameraState.Streaming ? DepthCameraState.Streaming : DepthCameraState.Connected : DepthCameraState.Disconnected;
        }

        /// <inheritdoc />
        /// <summary>
        /// Stops the stream.
        /// </summary>
        public void StopStream()
        {
            if (_multiFrameReader != null)
            {
                _multiFrameReader.MultiSourceFrameArrived -= OnMultiFrameArrived;
                _multiFrameReader.Dispose();
                _multiFrameReader = null;
            }

            _device?.Close();
            State = DepthCameraState.Disconnected;
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
        /// Updates the depth stream parameter.
        /// </summary>
        private void UpdateDepthStreamDescription()
        {
            var depthFrameDescription = _device.DepthFrameSource.FrameDescription;
            var depthStreamDescription = new StreamParameter(depthFrameDescription.Width, depthFrameDescription.Height, 40);
            StreamParameter = depthStreamDescription;
            ArrayUtils.InitializeArray(out _depthPixelData, depthFrameDescription.Width * depthFrameDescription.Height);
            ArrayUtils.InitializeArray(out _vertices, depthFrameDescription.Width * depthFrameDescription.Height);
        }

        /// <summary>
        /// Called when a [multi frame arrived].
        /// </summary>
        /// <param name="sender">The sender.</param>
        /// <param name="e">The <see cref="MultiSourceFrameArrivedEventArgs"/> instance containing the event data.</param>
        private void OnMultiFrameArrived(object sender, MultiSourceFrameArrivedEventArgs e)
        {
            var frame = e.FrameReference.AcquireFrame();

            if (frame.DepthFrameReference != null)
            {
                var depthFrameReference = frame.DepthFrameReference;
                _frame.Depth = ConvertVertices(GetVertices(depthFrameReference));
            }

            OnFrameReady(this, _frame);
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
                new StreamParameter(512, 424, 30)
            };

            return configs;
        }

        /// <summary>
        /// Gets the vertices of a depth frame.
        /// </summary>
        /// <param name="frameReference">The frame reference.</param>
        /// <returns> a pointcloud of <see cref="CameraSpacePoint"/></returns>
        private CameraSpacePoint[] GetVertices(DepthFrameReference frameReference)
        {
            var frame = frameReference.AcquireFrame();

            if (frame == null) return _vertices;

            using (frame)
            {
                frame.CopyFrameDataToArray(_depthPixelData);
                _device.CoordinateMapper.MapDepthFrameToCameraSpace(_depthPixelData, _vertices);
            }

            return _vertices;
        }

        /// <summary>
        /// Converts an array of <see cref="CameraSpacePoint"/> to an array of <see cref="Point3"/>.
        /// </summary>
        /// <param name="source">The source.</param>
        /// <returns>The converted array of <see cref="Point3"/></returns>
        private Point3[] ConvertVertices(IList<CameraSpacePoint> source)
        {
            if (_convertedVertices == null || _convertedVertices.Length != source.Count)
                ArrayUtils.InitializeArray(out _convertedVertices, source.Count);

            for (var i = 0; i < source.Count; ++i)
            {
                if (!float.IsNegativeInfinity(source[i].Z))
                    _convertedVertices[i].Set(source[i].X, source[i].Y, source[i].Z);
            }

            return _convertedVertices;
        }

        #endregion
    }
}
