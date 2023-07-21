using System;
using System.Collections.Generic;
using System.Linq;
using Implementation.Interfaces;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Networking.Components;
using ReFlex.Core.Networking.Interfaces;
using ReFlex.Core.Networking.Util;
using NLog;
using Prism.Events;
using ReFlex.Core.Events;

namespace Implementation.Components
{
    public class NetworkManager : INetworkManager
    {
        private IServer _server;
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
        private string _address = Localhost;
        private string _endpoint = "/ReFlex";
        private int _port = 8080;
        private readonly IEventAggregator _evtAggregator;
        

        public static string Localhost = "127.0.0.1";

        public string ServerAddress
        {
            get =>  _server?.Address;
        }

        public bool IsRunning => _server?.IsStarted ?? false;

        public string Address
        {
            get => _address;
            set
            {
                if (_address == value)
                    return;
                _address = value;
                UpdateServerAddress();
            }
        }

        public string Endpoint
        {
            get => _endpoint;
            set
            {
                if (_endpoint == value)
                    return;
                _endpoint = value;
                UpdateServerAddress();
            }
        }

        public int Port
        {
            get => _port;
            set
            {
                if (_port == value)
                    return;
                _port = value;
                UpdateServerAddress();
            }
        }

        public NetworkInterface Type
        {
            get => _server?.Type ?? NetworkInterface.None;
            set
            {
                ChangeServer(value);
            }
        }

        public NetworkManager(IEventAggregator eventAggregator)
        {
            _evtAggregator = eventAggregator;
        }

        public void Run()
        {
            if (_server == null)
                return;

            _server?.Start();
            Logger?.Info("Server started succesfully on port " + Port);
        }

        public void Broadcast(ICollection<Interaction> interactions)
        {
            if (_server == null || !_server.IsStarted)
                return;

            _server.Broadcast(interactions);
            Logger?.Trace("Server broadcast some interactions: " + interactions.FirstOrDefault());
        }

        public void Stop()
        {
            if (_server == null)
                return;

            _server.Stop();
            Logger?.Info("Server stopped");
        }

        private void ChangeServer(NetworkInterface type)
        {
            Stop();

            switch (type)
            {
                case NetworkInterface.Websockets:
                    _server = new WebSocketServer(Address, Port, Endpoint);
                    break;
                case NetworkInterface.Tcp:
                    _server = new NetworkServer(Address, Port);
                    break;
                case NetworkInterface.None:
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(type), type, null);
            }
        }

        private void UpdateServerAddress()
        {
            if (_server == null)
            {
                ChangeServer(Type);
                return;
            }

            _server.Address = $"{_address}:{_port}{_endpoint}";
        }
    }
}
