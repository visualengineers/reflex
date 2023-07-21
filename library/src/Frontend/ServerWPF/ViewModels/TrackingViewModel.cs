using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Windows.Input;
using Implementation.Interfaces;
using NLog;
using Prism.Commands;
using Prism.Events;
using Prism.Mvvm;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Tracking.Interfaces;
using ReFlex.Core.Tracking.Util;
using ReFlex.Frontend.ServerWPF.Events;
using ReFlex.Frontend.ServerWPF.Properties;
using ReFlex.Sensor.AzureKinectModule;
using ReFlex.Sensor.EmulatorModule;
using ReFlex.Sensor.Kinect2Module;
using ReFlex.Sensor.RealSenseD435Module;
using ReFlex.Sensor.RealSenseL515Module;
using ReFlex.Sensor.RealSenseR2Module;

namespace ReFlex.Frontend.ServerWPF.ViewModels
{
    public class TrackingViewModel : BindableBase, IDisposable
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        private readonly IEventAggregator _eventAggregator;
        private readonly ITrackingManager _trackingManager;
        private readonly Settings _settings;

        public ObservableCollection<IDepthCamera> DepthCameras { get; set; }

        /// <summary>
        /// A collection of all supported <see cref="StreamParameter"/>.
        /// </summary>
        /// <value>
        /// The camera configurations.
        /// </value>
        public ObservableCollection<StreamParameter> CameraConfigurations { get; set; }

        public bool IsCameraChosen => _trackingManager?.ChosenCamera != null;

        /// <summary>
        /// Gets a value indicating whether a camera configuration is chosen.
        /// </summary>
        /// <value>
        ///   <c>true</c> if a camera configuration is chosen; otherwise, <c>false</c>.
        /// </value>
        public bool IsCameraConfigurationChosen => _trackingManager?.ChosenStreamConfiguration != null;

        public string ChosenCameraName => _trackingManager?.ChosenCamera is null ?
            "no camera selected" : _trackingManager.ChosenCamera.ModelDescription;

        /// <summary>
        /// Gets the chosen stream configuration as string.
        /// </summary>
        /// <value>
        /// The chosen stream configuration as string.
        /// </value>
        public string ChosenStreamConfigurationString =>
            _trackingManager?.ChosenStreamConfiguration?.ToString() ?? "no configuration selected";

        /// <summary>
        /// Gets the chosen camera and stream configuration as string.
        /// </summary>
        /// <value>
        /// The chosen camera and stream configuration as string.
        /// </value>
        public string ChosenCameraAndStreamConfigurationString =>
            ChosenCameraName + " - " + ChosenStreamConfigurationString;

        public DepthCameraState CameraState => _trackingManager?.ChosenCamera?.State ?? DepthCameraState.Disconnected;

        public bool TrackingState
        {
            get => _trackingManager.TrackingState;
            set
            {
                if (_trackingManager is null)
                    return;

                _trackingManager.TrackingState = value;
                RaisePropertyChanged(nameof(TrackingState));
            }
        }

        /// <summary>
        /// Gets the choose camera command.
        /// </summary>
        /// <value>
        /// The choose camera command.
        /// </value>
        public ICommand ChooseCameraCommand { get; }

        /// <summary>
        /// Gets the choose camera configuration command.
        /// </summary>
        /// <value>
        /// The choose camera configuration command.
        /// </value>
        public ICommand ChooseCameraConfigurationCommand { get; }

        public TrackingViewModel(IEventAggregator eventAggregator, ITrackingManager trackingManager)
        {
            _eventAggregator = eventAggregator;
            _trackingManager = trackingManager;

            _settings = Settings.Default;

            DepthCameras = new ObservableCollection<IDepthCamera>();

            try {
                DepthCameras.Add(new RealsenseR2Camera());
            } catch (Exception exception) {
                Logger.Error(exception);
            }

            try {
                DepthCameras.Add(new Kinect2Camera());
            } catch (Exception exception) {
                Logger.Error(exception);
            }

            try {
                DepthCameras.Add(new RealsenseD435Camera());
            } catch (Exception exception) {
                Logger.Error(exception);
            }

            try
            {
                DepthCameras.Add(new RealsenseL515Camera());
            }
            catch (Exception exception)
            {
                Logger.Error(exception);
            }

            try
            {
                DepthCameras.Add(new AzureKinectCamera());
            }
            catch (Exception exception)
            {
                Logger.Error(exception);
            }

            try
            {
                // DepthCameras.Add(new EmulatorCamera("127.0.0.1", 41000, "/Emulator"));
                DepthCameras.Add(new EmulatorCamera(_settings.EmulatorAddress, _settings.EmulatorPort, _settings.EmulatorEndpoint));
            }
            catch (Exception exception)
            {
                Logger.Error(exception);
            }

            CameraConfigurations = new ObservableCollection<StreamParameter>();

            
            _eventAggregator.GetEvent<RequestSaveSettingsEvent>()?.Subscribe(SaveSettings);
            _eventAggregator.GetEvent<RequestLoadSettingsEvent>()?.Subscribe(LoadSettings);

            ChooseCameraCommand = new DelegateCommand<IDepthCamera>(ChooseCamera);
            ChooseCameraConfigurationCommand = new DelegateCommand<StreamParameter>(ChooseCameraConfiguration);
        }

        public void Dispose()
        {
            _eventAggregator.GetEvent<RequestSaveSettingsEvent>()?.Unsubscribe(SaveSettings);
            _eventAggregator.GetEvent<RequestLoadSettingsEvent>()?.Unsubscribe(LoadSettings);
        }

        /// <summary>
        /// Chooses the camera.
        /// </summary>
        /// <param name="camera">The camera.</param>
        private void ChooseCamera(IDepthCamera camera)
        {
            TrackingState = false;

            if (_trackingManager?.ChosenCamera != null)
                _trackingManager.ChosenCamera.StateChanged -= OnChosenCameraStateChanged;

            _trackingManager?.ChooseCamera(camera);

            CameraConfigurations?.Clear();
            CameraConfigurations?.AddRange(camera.GetPossibleConfigurations());

            if (CameraConfigurations?.First() != null)
                ChooseCameraConfiguration(CameraConfigurations.First());

            RaisePropertyChanged(nameof(IsCameraChosen));
            RaisePropertyChanged(nameof(ChosenCameraName));
            RaisePropertyChanged(nameof(ChosenCameraAndStreamConfigurationString));

            if (_trackingManager?.ChosenCamera != null)
                _trackingManager.ChosenCamera.StateChanged += OnChosenCameraStateChanged;
        }

        private void OnChosenCameraStateChanged(object sender, DepthCameraState state)
        {
            RaisePropertyChanged(nameof(CameraState));
        }

        /// <summary>
        /// Chooses the camera configuration.
        /// </summary>
        /// <param name="configuration">The configuration.</param>
        private void ChooseCameraConfiguration(StreamParameter configuration)
        {
            TrackingState = false;

            _trackingManager?.ChooseConfiguration(configuration);

            RaisePropertyChanged(nameof(IsCameraConfigurationChosen));
            RaisePropertyChanged(nameof(ChosenStreamConfigurationString));
            RaisePropertyChanged(nameof(ChosenCameraAndStreamConfigurationString));
        }

        /// <summary>
        /// Saves the settings.
        /// </summary>
        private void SaveSettings()
        {
            if (_trackingManager?.ChosenCamera?.ModelDescription == null)
                return;

            _settings.ChosenCamera = _trackingManager.ChosenCamera.ModelDescription;
            _settings.CameraConfiguration = _trackingManager.ChosenStreamConfiguration;
            _settings.Save();
        }

        /// <summary>
        /// Loads the settings.
        /// </summary>
        private void LoadSettings()
        {
            if (_settings == null)
                return;

            foreach (var camera in DepthCameras)
                if (camera.ModelDescription.Equals(_settings.ChosenCamera))
                    ChooseCamera(camera);

            ChooseCameraConfiguration(_settings.CameraConfiguration);

            if (_settings.IsAutoStartEnabled && IsCameraChosen)
                TrackingState = true;
        }
    }
}
