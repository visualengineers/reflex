using Implementation.Interfaces;
using Microsoft.AspNetCore.SignalR;
using NLog;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Events;
using ReFlex.Core.Tracking.Interfaces;
using ReFlex.Core.Tracking.Util;
using ReFlex.Sensor.EmulatorModule;
using TrackingServer.Data.Config;
using TrackingServer.Data.Tracking;
using TrackingServer.Hubs;
using TrackingServer.Util;

namespace TrackingServer.Model
{
    public class TrackingService : SignalRBaseService<TrackingConfigState, TrackingHub>, IAutoStartService
    {
        #region Fields

        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        private readonly ITrackingManager _trackingMgr;
        private readonly ConfigurationManager _configMgr;
        private readonly DepthStreamRecorder _recorder;

        private readonly List<IDepthCamera> _depthCameras;
        private readonly List<StreamParameter> _cameraConfigurations;
        
        private readonly HubGroupSubscriptionManager<RecordingStateUpdate> _recordingStateSubscriptions;

        private readonly IEventAggregator _eventAggregator;

        #endregion

        #region Properties

        public IObservable<TrackingConfigState> State { get => CurrentState; }

        public IHubGroupSubscriptionManager RecordingStateManager => _recordingStateSubscriptions;

        #endregion

        #region Constructor

        public TrackingService(IEventAggregator eventAggregator, ITrackingManager trackingManager, CameraManager camManager, ConfigurationManager configManager, IHubContext<TrackingHub> hubContext, DepthStreamRecorder recorder)
        : base(TrackingHub.TrackingStateGroup, hubContext)
        {
            _trackingMgr = trackingManager;
            _configMgr = configManager;
            _recorder = recorder;

            _depthCameras = camManager.AvailableCameras;

            _cameraConfigurations = new List<StreamParameter>();

            _recordingStateSubscriptions = new HubGroupSubscriptionManager<RecordingStateUpdate>("recordingState");
            _recordingStateSubscriptions.Setup<TrackingHub, RecordingStateUpdate>(
                (handler) => _recorder.RecordingStateUpdated += handler,
                (handler) => _recorder.RecordingStateUpdated -= handler,
                (evt) => evt.EventArgs,
                hubContext,
                TrackingHub.RecordingGroup);

            _eventAggregator = eventAggregator;
            _eventAggregator.GetEvent<RequestServiceRestart>().Subscribe(StartService);
        }

        #endregion

        #region public Methods

        public void Init()
        {
            InitFromConfig();

            UpdateState();

        }

        public IEnumerable<IDepthCamera> GetCameras()
        {
            return _depthCameras;
        }

        public IEnumerable<StreamParameter> GetConfigurations(int id)
        {
            if (id >= 0 && id < _depthCameras.Count)
                return _depthCameras[id].GetPossibleConfigurations();

            return new List<StreamParameter>();
        }

        public IDepthCamera GetCamera(int id)
        {
            if (id >= 0 && id < _depthCameras.Count)
                return _depthCameras[id];

            Logger.Error($"Camera with index {id} not registered. Choose a camera with an index < {_depthCameras.Count}.");

            return null;
        }

        public IDepthCamera GetSelectedCamera()
        {
            return _trackingMgr?.ChosenCamera;
        }

        public StreamParameter GetSelectedCameraConfiguration()
        {
            return _trackingMgr?.ChosenStreamConfiguration;
        }

        public TrackingConfigState GetStatus()
        {
            return CurrentState.Value;
        }

        public sealed override TrackingConfigState GetState()
        {
            return new TrackingConfigState
            {
                DepthCameraStateName = _trackingMgr?.ChosenCamera != null 
                    ? Enum.GetName(typeof(DepthCameraState), _trackingMgr.ChosenCamera.State)
                    : Enum.GetName(typeof(DepthCameraState), DepthCameraState.Disconnected),
                IsCameraSelected = _trackingMgr?.ChosenCamera != null,
                SelectedCameraName = _trackingMgr?.ChosenCamera?.Id ?? "",
                SelectedConfigurationName = _trackingMgr?.ChosenStreamConfiguration?.ToString() ?? ""
            };
        }

        public void ToggleTracking(int id, int configIdx)
        {
            var trackingState = _trackingMgr.TrackingState;

            SelectCameraById(id);
            SelectConfigurationById(configIdx);
            
            if (trackingState == _trackingMgr.TrackingState)
                _trackingMgr.ToggleTracking();
            UpdateState();
        }

        public void SelectCameraById(int id)
        {
            if (id < 0 || id >= _depthCameras.Count)
            {
                Logger.Error(
                    $"Camera with index {id} not registered. Choose a camera with an index < {_depthCameras.Count}.");
                return;
            }

            SelectCamera(_depthCameras[id]);
        }

        public void SelectConfigurationById(int id)
        {
            if (_cameraConfigurations == null || id < 0 || id >= _cameraConfigurations.Count)
            {
                Logger.Error(
                    $"Configuration with index {id} not available. Choose a configuration with an index < {_cameraConfigurations?.Count}.");
                return;
            }

            SelectConfiguration(_cameraConfigurations[id]);
        }

        public void StartService()
        {
            _trackingMgr.TrackingState = false;

            InitFromConfig();

            _trackingMgr.TrackingState = true;
        }

        #endregion

        #region private Methods

        private void SelectCamera(IDepthCamera camera, string param = null)
        {
            if (_trackingMgr?.ChosenCamera != null)
                _trackingMgr.ChosenCamera.StateChanged -= OnSelectedCameraStateChanged;

            _trackingMgr?.ChooseCamera(camera);

            _cameraConfigurations?.Clear();
            _cameraConfigurations?.AddRange(camera.GetPossibleConfigurations());
            
            var cfg= _cameraConfigurations?.FirstOrDefault();

            if (!string.IsNullOrWhiteSpace(param))
            {
                var saved = _cameraConfigurations?.FirstOrDefault(c => Equals(c.Description, param));
                if (saved != null)
                    cfg = saved;
            }
            
            if (cfg != null)
                SelectConfiguration(cfg);

            UpdateState();

            if (_trackingMgr?.ChosenCamera != null)
                _trackingMgr.ChosenCamera.StateChanged += OnSelectedCameraStateChanged;
        }

        private void SelectConfiguration(StreamParameter configuration)
        {
            _trackingMgr?.ChooseConfiguration(configuration);

            UpdateState();

            _configMgr.Settings.CameraConfigurationValues = new CameraConfiguration
            {
                Width = configuration.Width,
                Height = configuration.Height,
                Framerate = configuration.Framerate
            };
        }

        private void UpdateState()
        {
            CurrentState.OnNext(GetState());
        }

        private void InitFromConfig()
        {
            var camera = _depthCameras.FirstOrDefault(cam => Equals(cam.ModelDescription, _configMgr.Settings.DefaultCamera));
            if (camera == null)
                return;

            SelectCamera(camera, _configMgr.Settings.CameraConfigurationValues.GetCameraDescription());
        }
        
        private void OnSelectedCameraStateChanged(object sender, DepthCameraState e)
        {
            Logger.Info($"got {nameof(_trackingMgr.ChosenCamera.StateChanged)} event with updated state: {e.ToString()}");
            UpdateState();
        }

        #endregion

    }
}