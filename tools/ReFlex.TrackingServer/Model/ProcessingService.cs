using Implementation.Interfaces;
using Microsoft.AspNetCore.SignalR;
using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Events;
using TrackingServer.Events;
using TrackingServer.Hubs;
using TrackingServer.Util;

namespace TrackingServer.Model
{
    public class ProcessingService : SignalRBaseService<string, ProcessingHub>, IAutoStartService
    {
        #region Fields

        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        private readonly ConfigurationManager _configManager;
        private readonly ITimerLoop _timerLoop;
        private readonly IInteractionManager _interactionManager;
        private readonly CalibrationService _calibrationService;

        private readonly HubGroupSubscriptionManager<IList<Interaction>>
            _interactionSubscriptions;
        private readonly HubGroupSubscriptionManager<IList<InteractionVelocity>>
            _velocitySubscriptions;
        private readonly HubGroupSubscriptionManager<IList<InteractionFrame>>
            _interactionFrameSubscriptions;
        private readonly HubGroupSubscriptionManager<InteractionHistory[]>
            _interactionHistorySubscriptions;

        #endregion

        #region Properties

        public string State { get => CurrentState?.Value; }

        public bool IsLoopRunning
        {
            get => _timerLoop.IsLoopRunning;

            set
            {
                if (_timerLoop.IsLoopRunning == value)
                    return;
                _timerLoop.IsLoopRunning = value;
                CurrentState?.OnNext(GetState());
            }
        }

        public int Interval
        {
            get => _timerLoop.IntervalLength;
            set => _timerLoop.IntervalLength = value;
        }
        public ObserverType ObserverType
        {
            get => _interactionManager.Type;
            set => _interactionManager.Type = value;
        }

        public IHubGroupSubscriptionManager InteractionSubscriptionManager => _interactionSubscriptions;

        public IHubGroupSubscriptionManager InteractionVelocitySubscriptionManager => _velocitySubscriptions;

        public IHubGroupSubscriptionManager InteractionFrameSubscriptionManager => _interactionFrameSubscriptions;

        public IHubGroupSubscriptionManager InteractionHistorySubscriptionManager => _interactionHistorySubscriptions;

        #endregion

        #region Constrcutor

        public ProcessingService(ITimerLoop loop, IInteractionManager interactionManager,
            ConfigurationManager configManager, CalibrationService calibrationService,
            IEventAggregator eventAggregator, IHubContext<ProcessingHub> hubContext)
            : base(ProcessingHub.ProcessingStateGroup, hubContext)
        {
            _timerLoop = loop;
            _interactionManager = interactionManager;
            _configManager = configManager;
            _calibrationService = calibrationService;

            eventAggregator.GetEvent<RequestSaveSettingsEvent>()?.Subscribe(SaveSettings);
            eventAggregator.GetEvent<RequestLoadSettingsEvent>()?.Subscribe(LoadSettings);
            eventAggregator.GetEvent<RequestServiceRestart>()?.Subscribe(StartService);

            _timerLoop.IsLoopRunningChanged += OnLoopRunningChanged;

            CurrentState.OnNext(GetState());

            _interactionSubscriptions = new HubGroupSubscriptionManager<IList<Interaction>>("interactions");
            _interactionSubscriptions.Setup(
                (handler) => _interactionManager.InteractionsUpdated += handler,
                (handler) => _interactionManager.InteractionsUpdated -= handler,
                hubContext,
                ProcessingHub.InteractionsGroup
                );

            _velocitySubscriptions = new HubGroupSubscriptionManager<IList<InteractionVelocity>>("velocities");
            _velocitySubscriptions.Setup(
                (handler) => _interactionManager.VelocitiesUpdated += handler,
                (handler) => _interactionManager.VelocitiesUpdated -= handler,
                hubContext,
                ProcessingHub.InteractionVelocitiesGroup
            );

            _interactionFrameSubscriptions = new HubGroupSubscriptionManager<IList<InteractionFrame>>("frames");
            _interactionFrameSubscriptions.Setup<ProcessingHub, IList<InteractionFrame>>(
                (handler) => _interactionManager.InteractionHistoryUpdated += handler,
                (handler) => _interactionManager.InteractionHistoryUpdated -= handler,
                evt => evt.EventArgs.ToArray(),
                hubContext,
                ProcessingHub.InteractionFramesGroup);

            _interactionHistorySubscriptions = new HubGroupSubscriptionManager<InteractionHistory[]>("history");
            _interactionHistorySubscriptions.Setup<ProcessingHub, IList<InteractionFrame>>(
                (handler) => _interactionManager.InteractionHistoryUpdated += handler,
                (handler) => _interactionManager.InteractionHistoryUpdated -= handler,
                (evt) => RetrieveHistory(evt.EventArgs.ToList()),
                hubContext,
                ProcessingHub.InteractionHistoryGroup);

            Logger. Info($"Sucessfully initialized {GetType().FullName}." );
        }

        #endregion

        #region public Methods

        public void Init()
        {
            LoadSettings();
        }

        #endregion

        public sealed override string GetState()
        {
            return IsLoopRunning ? "Active" : "Inactive";
        }

        public override void Dispose()
        {
            base.Dispose();
            _timerLoop.IsLoopRunningChanged -= OnLoopRunningChanged;
        }

        public void StartService()
        {
            if (IsLoopRunning)
            {
                IsLoopRunning = false;
            }

            Init();

            IsLoopRunning = true;
        }

        #region private Methods

        private void LoadSettings()
        {
            _timerLoop.IntervalLength = _configManager.Settings.ProcessingSettingValues.IntervalDuration;
            ObserverType = _configManager.Settings.ProcessingSettingValues.InteractionType;

            if (_configManager?.Settings?.FilterSettingValues != null)
            {
                _interactionManager.ExtremumTypeCheckMethod =
                    _configManager.Settings.FilterSettingValues.ExtremumSettings.CheckMethod;
                _interactionManager.ExtremumTypeCheckRadius =
                    _configManager.Settings.FilterSettingValues.ExtremumSettings.CheckRadius;
                _interactionManager.ExtremumTypeCheckNumSamples =
                    _configManager.Settings.FilterSettingValues.ExtremumSettings.NumSamples;
                _interactionManager.ExtremumTypeCheckFittingPercentage =
                    _configManager.Settings.FilterSettingValues.ExtremumSettings.FitPercentage;
            }

            if (_configManager?.Settings?.PredictionSettings != null)
            {
                _interactionManager.UseVelocityPrediction =
                    _configManager.Settings.PredictionSettings.UseVelocityPrediction;
                _interactionManager.NumFramesForPrediction =
                    _configManager.Settings.PredictionSettings.NumFramesForPrediction;
                _interactionManager.UseSecondDerivation =
                    _configManager.Settings.PredictionSettings.UseSecondDerivation;
                _interactionManager.SecondDerivationMagnitude =
                    _configManager.Settings.PredictionSettings.SecondDerivationMagnitude;
            }

            Logger.Info($"Loaded Settings for {GetType().FullName}. Setting {nameof(Interval)} to {Interval} ms");
        }

        private void SaveSettings()
        {
            _configManager.Settings.ProcessingSettingValues.IntervalDuration = _timerLoop.IntervalLength;
            _configManager.Update(_configManager.Settings);

            Logger.Info($"Saved Settings for {typeof(ProcessingService).FullName}.");
        }

        private InteractionHistory[] RetrieveHistory(IEnumerable<InteractionFrame> frames)
        {
            var calibratedFrames = frames.Select(rawFrame => new InteractionFrame(rawFrame.FrameId,
                _calibrationService.GetCalibratedInteractions(rawFrame.Interactions).ToList()));

            return InteractionHistory.RetrieveHistoryFromInteractionFrames(calibratedFrames).ToArray();

        }

        private void OnLoopRunningChanged(object sender, bool e)
        {
            IsLoopRunning = e;
            CurrentState?.OnNext(GetState());
        }

        #endregion
    }
}