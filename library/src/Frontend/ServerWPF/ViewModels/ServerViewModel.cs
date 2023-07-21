using System;
using System.Windows.Input;
using Implementation.Interfaces;
using NLog;
using Prism.Commands;
using Prism.Events;
using Prism.Mvvm;
using ReFlex.Core.Networking.Util;
using ReFlex.Frontend.ServerWPF.Events;
using ReFlex.Frontend.ServerWPF.Properties;

namespace ReFlex.Frontend.ServerWPF.ViewModels
{
    public class ServerViewModel : BindableBase, IDisposable
    {
        private readonly INetworkManager _networkManager;
        private readonly IEventAggregator _eventAggregator;
        private Settings _settings;
        private NetworkInterface _type;
        private int _port;

        private bool _isServerBroadcasting;
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        public NetworkInterface Type
        {
            get
            {
                if (_networkManager != null)
                    _type = _networkManager.Type;

                return _type;
            }
            set
            {               
                if (_networkManager != null && _type != value)
                {
                    IsServerBroadcasting = false;
                    _networkManager.Type = value;
                }                 

                SetProperty(ref _type, value);
            }
        }

        public int Port
        {
            get
            {
                if (_networkManager != null)
                    _port = _networkManager.Port;

                return _port;
            }
            set
            {
                if (_networkManager != null)
                    _networkManager.Port = value;

                SetProperty(ref _port, value);
            }
        }

        public bool IsServerBroadcasting
        {
            get => _isServerBroadcasting;
            set
            {
                if (_networkManager == null)
                    return;

                if (value)
                    StartServer();
                else
                    StopServer();

                SetProperty(ref _isServerBroadcasting, value);
            }
        }

        public ICommand StartServerCommand { get; }
        public ICommand StopServerCommand { get; }

        public ServerViewModel(INetworkManager networkManager, IEventAggregator eventAggregator)
        {
            _networkManager = networkManager;
            _eventAggregator = eventAggregator;

            _eventAggregator.GetEvent<RequestSaveSettingsEvent>()?.Subscribe(SaveSettings);
            _eventAggregator.GetEvent<RequestLoadSettingsEvent>()?.Subscribe(LoadSettings);

            StartServerCommand = new DelegateCommand(StartServer);
            StopServerCommand = new DelegateCommand(StopServer);

            LoadSettings();
        }

        private void StartServer()
        {
            Logger.Log(LogLevel.Info, $"started Server of type {_networkManager?.Type} on address: {_networkManager?.Address}");
            _networkManager?.Run();
        }

        private void StopServer()
        {
            _networkManager?.Stop();
            Logger.Log(LogLevel.Info,
                $"stopped Server (Address: {_networkManager?.Address})");
        }

        private void LoadSettings()
        {
            if (_settings == null)
                _settings = Settings.Default;

            Port = _settings.Port;
            Type = _settings.NetworkInterface;

            if (_settings.IsAutoStartEnabled)
                IsServerBroadcasting = true;
        }

        private void SaveSettings()
        {
            if (_settings == null)
                _settings = Settings.Default;

            _settings.Port = Port;
            _settings.NetworkInterface = Type;
            _settings.Save();
        }

        public void Dispose()
        {
            _eventAggregator?.GetEvent<RequestSaveSettingsEvent>()?.Unsubscribe(SaveSettings);
            _eventAggregator?.GetEvent<RequestLoadSettingsEvent>()?.Unsubscribe(LoadSettings);
        }
    }
}
