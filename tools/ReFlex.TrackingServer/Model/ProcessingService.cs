using System;
using System.Collections.Generic;
using System.Linq;
using Implementation.Interfaces;
using Microsoft.AspNetCore.SignalR;
using NLog;
using Prism.Events;
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

            Logger.Info($"Loaded Settings for {GetType().FullName}. Setting {nameof(Interval)} to {Interval} ms");
        }

        private void SaveSettings()
        {
            _configManager.Settings.ProcessingSettingValues.IntervalDuration = _timerLoop.IntervalLength;
            _configManager.Update(_configManager.Settings);

            Logger.Info($"Saved Settings for {typeof(ProcessingService).FullName}.");
        }

        private InteractionHistory[] RetrieveHistory(List<InteractionFrame> frames)
        {
            var ids = frames.SelectMany(frame => frame.Interactions.Select(interaction => interaction.TouchId)).Distinct().ToList();

            var result = new List<InteractionHistory>();
            
            ids.ForEach(id =>
            {
                var elements = frames.OrderByDescending(frame => frame.FrameId)
                    .Select(rawFrame => new InteractionFrame(rawFrame.FrameId, _calibrationService.GetCalibratedInteractions(rawFrame.Interactions).ToList()))
                    .Select(frame => new InteractionHistoryElement(frame.FrameId, frame.Interactions.FirstOrDefault(interaction => Equals(interaction.TouchId, id))))
                    .Where(elem => elem.Interaction != null).ToList();
                if (elements.Count > 0)
                {
                    result.Add(new InteractionHistory(id, elements));
                }
            });

            return result.OrderBy(history => history.TouchId).ToArray();
        }
        
        private void OnLoopRunningChanged(object sender, bool e)
        {
            IsLoopRunning = e;
            CurrentState?.OnNext(GetState());
        }
        
        #endregion
    }
}