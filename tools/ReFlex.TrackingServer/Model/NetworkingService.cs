using Implementation.Interfaces;
using Microsoft.AspNetCore.SignalR;
using NLog;
using ReFlex.Core.Events;
using ReFlex.Core.Networking.Util;
using TrackingServer.Events;
using TrackingServer.Hubs;
using LogLevel = NLog.LogLevel;

namespace TrackingServer.Model
{
    public class NetworkingService : SignalRBaseService<string, NetworkingHub>, IAutoStartService
    {
        private readonly ConfigurationManager _settingsManager;
        private readonly INetworkManager _networkManager;
        private readonly IEventAggregator _eventAggregator;

        private NetworkInterface _type;
        private int _port;

        private bool _isServerBroadcasting;

        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        public NetworkInterface Type
        {
            get
            {
                _type = _networkManager.Type;
                return _type;
            }
            set
            {
                if (_type == value)
                    return;

                IsServerBroadcasting = false;
                _networkManager.Type = value;
            }
        }

        public int Port
        {
            get
            {
                _port = _networkManager.Port;
                return _port;
            }
            set => _networkManager.Port = value;
        }

        public string Address
        {
            get => _networkManager.Address;
            set => _networkManager.Address = value;
        }

        public string Endpoint
        {
            get => _networkManager.Endpoint;
            set => _networkManager.Endpoint = value;
        }

        public bool IsServerBroadcasting
        {
            get => _isServerBroadcasting;
            set
            {
                if (value)
                    StartServer();
                else
                    StopServer();

                _isServerBroadcasting = _networkManager.IsRunning;

                CurrentState.OnNext(GetState());
            }
        }

        public string State => CurrentState.Value ?? "";

        public NetworkingService(ConfigurationManager settingsManager, INetworkManager networkManager,
            IEventAggregator eventAggregator, IHubContext<NetworkingHub> hubContext)
        : base(NetworkingHub.NetworkingStateGroup, hubContext)
        {
            _settingsManager = settingsManager;
            _networkManager = networkManager;
            _eventAggregator = eventAggregator;

            _eventAggregator.GetEvent<RequestSaveSettingsEvent>()?.Subscribe(SaveSettings);
            _eventAggregator.GetEvent<RequestLoadSettingsEvent>()?.Subscribe(LoadSettings);

            _eventAggregator.GetEvent<RequestServiceRestart>()?.Subscribe(StartService);

            CurrentState.OnNext(GetState());

            Logger.Info($"Sucessfully initialized {GetType().FullName}." );
        }

        public void StartService()
        {
            IsServerBroadcasting = false;

            LoadSettings();

            IsServerBroadcasting = true;
        }

        public void Init()
        {
            LoadSettings();
        }

        public override void Dispose()
        {
            base.Dispose();
            _eventAggregator.GetEvent<RequestSaveSettingsEvent>()?.Unsubscribe(SaveSettings);
            _eventAggregator.GetEvent<RequestLoadSettingsEvent>()?.Unsubscribe(LoadSettings);
        }

        private void StartServer()
        {
            Logger.Log(LogLevel.Info, $"started Server of type {_networkManager.Type} on address: {_networkManager.ServerAddress}");
            _networkManager.Run();
        }

        private void StopServer()
        {
            _networkManager.Stop();
            Logger.Log(LogLevel.Info,
                $"stopped Server (Address: {_networkManager.ServerAddress})");
        }

        private void LoadSettings()
        {
            Port = _settingsManager.Settings.NetworkSettingValues.Port;
            Type = _settingsManager.Settings.NetworkSettingValues.NetworkInterfaceType;
        }

        private void SaveSettings()
        {
            _settingsManager.Settings.NetworkSettingValues.Port = Port;
            _settingsManager.Settings.NetworkSettingValues.NetworkInterfaceType = Type;
        }

        public sealed override string GetState()
        {
            var stateMsg = $"NetworkService is {(_isServerBroadcasting ? "broadcasting" : "inactive")} using Method '{Enum.GetName(typeof(NetworkInterface), Type)}' on Address {_networkManager.ServerAddress}.";
            return stateMsg;
        }
    }
}
