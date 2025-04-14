using System.Reactive.Subjects;
using Implementation.Interfaces;
using Microsoft.AspNetCore.SignalR;
using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Events;
using ReFlex.Core.Tuio.Interfaces;
using ReFlex.Core.Tuio.Util;
using TrackingServer.Data.Tuio;
using TrackingServer.Events;
using TrackingServer.Hubs;
using TrackingServer.Util;

namespace TrackingServer.Model
{
    public class TuioService : SignalRBaseService<string, TuioHub>, IAutoStartService
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        private readonly IEventAggregator _eventAggregator;
        private readonly ITuioBroadcast _tuioBroadcast;
        private readonly ConfigurationManager _settingsManager;
        private readonly IInteractionManager _interactionManager;
        private readonly ITrackingManager _trackingManager;

        private readonly BehaviorSubject<TuioPackageDetails> _currentPackage;
        private readonly IDisposable _currentPackageHubSubscription;
        
        private readonly HubGroupSubscriptionManager<TuioPackageDetails>
            _packageDetailsSubscriptions;

        private bool _isServerBroadcasting;

        public event EventHandler<TuioPackageDetails> PackageDetailsUpdated;

        public string State
        {
            get => CurrentState.Value;
        }

        public TuioConfiguration Configuration { get; private set; }

        public bool IsTuioBroadcastingEnabled
        {
            get => _isServerBroadcasting;
            set
            {
                if (_tuioBroadcast == null)
                    return;

                if (value)
                    StartBroadcasting();
                else
                    StopBroadcasting();

                _isServerBroadcasting = value;

                CurrentState.OnNext(GetState());
            }
        }

        public TuioPackageDetails CurrentPackage => _currentPackage.Value;

        public IHubGroupSubscriptionManager PackageDetailsSubscriptionManager => _packageDetailsSubscriptions;
        
        public TuioService(
            ConfigurationManager settingsManager,
            IInteractionManager interactionManager,
            ITrackingManager trackingManager,
            IEventAggregator eventAggregator,
            ITuioBroadcast tuioBroadcast, IHubContext<TuioHub> hubContext)
        : base(TuioHub.TuioStateGroup, hubContext)
        {
            _eventAggregator = eventAggregator;
            _tuioBroadcast = tuioBroadcast;
            _settingsManager = settingsManager;
            _interactionManager = interactionManager;
            _trackingManager = trackingManager;

            _eventAggregator.GetEvent<RequestSaveSettingsEvent>()?.Subscribe(SaveSettings);
            _eventAggregator.GetEvent<RequestLoadSettingsEvent>()?.Subscribe(LoadSettings);

            _trackingManager.TrackingStateChanged += UpdateConfig;

            _currentPackage = new BehaviorSubject<TuioPackageDetails>(new TuioPackageDetails());

            _currentPackageHubSubscription = _currentPackage.Subscribe(package =>
            {
                PackageDetailsUpdated?.Invoke(this, package);
            });
            
            _packageDetailsSubscriptions = new HubGroupSubscriptionManager<TuioPackageDetails>("currentPackage");
            _packageDetailsSubscriptions.Setup(
                (handler) => PackageDetailsUpdated += handler,
                (handler) => PackageDetailsUpdated -= handler,
                hubContext,
                TuioHub.PackageDetailsGroup
            );
            
            CurrentState.OnNext(GetState());

            _eventAggregator.GetEvent<RequestServiceRestart>().Subscribe(StartService);

            Logger.Info($"Sucessfully initialized {GetType().FullName}.");
        }

        public void StartService()
        {
            IsTuioBroadcastingEnabled = false;
            
            LoadSettings();

            IsTuioBroadcastingEnabled = true;




        }

        private void UpdateConfig(object sender, TrackingStateChangedEventArgs e)
        {
            Configuration.SensorDescription = e.Camera.ModelDescription;

            var streamParams = e.Camera.StreamParameter;
            if (streamParams != null)
            {
                Configuration.SensorWidth = streamParams.Width;
                Configuration.SensorHeight = streamParams.Height;
            }

            if (e.TrackingState)
            {
                Configuration.SessionId += 1;
            }

            SaveSettings();
        }

        public void Init()
        {
            LoadSettings();
        }

        private void LoadSettings()
        {
            Configuration = _settingsManager.Settings.TuioSettingValues ?? new TuioConfiguration();

            ApplyConfiguration();
        }

        private void SaveSettings()
        {
            _settingsManager.Settings.TuioSettingValues = Configuration;
        }

        public void ApplyConfiguration(bool doSave = false)
        {
            _tuioBroadcast?.Configure(Configuration);
            if (doSave)
                SaveSettings();
        }

        private void StopBroadcasting()
        {
            _interactionManager.InteractionsUpdated -= BroadcastTuio;
        }

        private void StartBroadcasting()
        {
            _interactionManager.InteractionsUpdated += BroadcastTuio;
        }

        private async void BroadcastTuio(object sender, IList<Interaction> interactions)
        {
            if (_tuioBroadcast == null || interactions == null)
                return;

            var packageContent = await _tuioBroadcast.Broadcast(interactions.ToList());
            var frameId = _tuioBroadcast.FrameId;
            var sessionId = _tuioBroadcast.Configuration?.SessionId ?? 0;
            
            _currentPackage.OnNext(new TuioPackageDetails
            {
                PackageContent = packageContent,
                FrameId = frameId,
                SessionId = sessionId
            });
        }

        public sealed override string GetState()
        {
            var transport = _tuioBroadcast?.Configuration?.Transport != null
                ? Enum.GetName(typeof(TransportProtocol), _tuioBroadcast.Configuration.Transport)
                : "NONE";

            var protocol = _tuioBroadcast?.Configuration?.Protocol != null
                ? Enum.GetName(typeof(ProtocolVersion), _tuioBroadcast.Configuration.Protocol)
                : "NONE";

            var interpretation = _tuioBroadcast?.Configuration?.Interpretation != null
                ? Enum.GetName(typeof(TuioInterpretation), _tuioBroadcast.Configuration.Interpretation)
                : "NONE";

            var stateMsg = $"{nameof(TuioService)} is {(_isServerBroadcasting ? "broadcasting" : "inactive")}{Environment.NewLine} " +
                           $"on Address {_tuioBroadcast?.Configuration?.ServerAddress ?? "NONE"}:{_tuioBroadcast?.Configuration?.ServerPort ?? 0}.";
            return stateMsg;
        }

        public override void Dispose()
        {
            base.Dispose();
            
            ((IDisposable)_tuioBroadcast)?.Dispose();

            _eventAggregator?.GetEvent<RequestSaveSettingsEvent>()?.Unsubscribe(SaveSettings);
            _eventAggregator?.GetEvent<RequestLoadSettingsEvent>()?.Unsubscribe(LoadSettings);
            _eventAggregator?.GetEvent<RequestServiceRestart>()?.Unsubscribe(StartService);

            _trackingManager.TrackingStateChanged -= UpdateConfig;

            _currentPackage?.Dispose();
            _currentPackageHubSubscription?.Dispose();
            
            StopBroadcasting();
            
            GC.SuppressFinalize(this);
        }
    }
}