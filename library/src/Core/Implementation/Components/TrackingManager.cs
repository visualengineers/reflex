using System;
using Implementation.Interfaces;
using Prism.Events;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Events;
using ReFlex.Core.Tracking.Interfaces;
using ReFlex.Core.Tracking.Util;

namespace Implementation.Components
{
    public class TrackingManager : ITrackingManager, IDisposable
    {
        private readonly IEventAggregator _eventAggregator;
        private readonly IDepthImageManager _depthImageManager;
        private bool _trackingState;

        public IDepthCamera ChosenCamera { get; private set; }

        /// <summary>
        /// Gets the chosen stream configuration.
        /// </summary>
        /// <value>
        /// The chosen stream configuration.
        /// </value>
        /// <inheritdoc />
        public StreamParameter ChosenStreamConfiguration { get; private set; }

        public event EventHandler<TrackingStateChangedEventArgs> TrackingStateChanged;

        public bool TrackingState
        {
            get => _trackingState;
            set => _trackingState = value ? StartTracking() : StopTracking();
        }

        public TrackingManager(IEventAggregator eventAggregator, IDepthImageManager depthImageManager)
        {
            _eventAggregator = eventAggregator;
            _depthImageManager = depthImageManager;

            TrackingState = false;

            _eventAggregator?.GetEvent<RequestChooseCameraEvent>().Subscribe(ChooseCamera);
            _eventAggregator?.GetEvent<RequestToggleTrackingEvent>().Subscribe(ToggleTracking);
        }

        public void Dispose()
        {
            _eventAggregator?.GetEvent<RequestChooseCameraEvent>().Unsubscribe(ChooseCamera);
            _eventAggregator?.GetEvent<RequestToggleTrackingEvent>().Unsubscribe(ToggleTracking);
        }

        public void ChooseCamera(IDepthCamera camera)
        {
            TrackingState = false;
            ChosenCamera = camera;


        }

        /// <summary>
        /// Chooses the stream-configuration.
        /// </summary>
        /// <param name="configuration">The configuration.</param>
        /// <inheritdoc />
        public void ChooseConfiguration(StreamParameter configuration)
        {
            if (ChosenCamera == null)
                return;

            if (!ChosenCamera.GetPossibleConfigurations().Contains(configuration))
                return;

            ChosenStreamConfiguration = configuration;
            _eventAggregator.GetEvent<NotifyDepthCameraConfigurationChosenEvent>().Publish(ChosenStreamConfiguration);
        }

        public void ToggleTracking() => TrackingState = !TrackingState;

        private bool StartTracking()
        {
            if (ChosenCamera == null || ChosenStreamConfiguration == null)
                return false;

            var payload = new Tuple<int, int>(ChosenStreamConfiguration.Width, ChosenStreamConfiguration.Height);
            _eventAggregator?.GetEvent<NotifyCameraChosenEvent>().Publish(payload);

            _depthImageManager.Initialize(ChosenStreamConfiguration.Width, ChosenStreamConfiguration.Height);

            ChosenCamera.EnableStream(ChosenStreamConfiguration);
            ChosenCamera.StartStream();
            ChosenCamera.FrameReady += OnFrameReady;
            ChosenCamera.DepthImageReady += OnDepthImageReady;

            TrackingStateChanged?.Invoke(this, new TrackingStateChangedEventArgs(ChosenCamera, true));

            return true;
        }

        private bool StopTracking()
        {
            if (ChosenCamera is null)
                return false;

            ChosenCamera.FrameReady -= OnFrameReady;
            ChosenCamera.DepthImageReady -= OnDepthImageReady;
            ChosenCamera.StopStream();

            TrackingStateChanged?.Invoke(this, new TrackingStateChangedEventArgs(ChosenCamera, false));

            return false;
        }

        /// <summary>
        /// mthod for invoking processing of depth image 
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="frame"></param>
        private void OnFrameReady(object sender, DepthCameraFrame frame) =>
            _depthImageManager?.Update(frame);

        /// <summary>
        /// Method for notifying depth data streaming instances about new data (byte data) 
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void OnDepthImageReady(object sender, ImageByteArray e)
        {
            _depthImageManager?.Update(e);
        }
    }
}
