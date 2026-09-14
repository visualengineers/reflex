using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Networking.Components;
using ReFlex.Core.Networking.Interfaces;
using ReFlex.Core.Networking.Util;

namespace ReFlex.Utilities.ConsoleServerDemo
{
    public class Server
    {
        private readonly IServer _server;
        private readonly Logger _logger;

        public Server(Logger logger, NetworkInterface type, string address, int port, string endpoint = "")
        {
            switch (type)
            {
                case NetworkInterface.None:
                    throw new InvalidEnumArgumentException("Do not try to create a server with type 'None'.");
                case NetworkInterface.Websockets:
                    _server = new WebSocketServer(address, port, endpoint);
                    break;
                case NetworkInterface.Tcp:
                    _server = new Core.Networking.Components.NetworkServer(address, port);
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(type), type, $"Unsupported Server type: {Enum.GetName(typeof(NetworkInterface), type)}.");
            }
            _logger = logger;
        }

        public void Run()
        {
            if (_server == null)
                return;

            _server?.Start();
            _logger?.Log(LogLevel.Info, $"Server started successfully on {_server.Address}.");
        }

        public void Broadcast(ICollection<Interaction> interactions)
        {
            if (_server == null || !_server.IsStarted)
                return;

            _server.Broadcast(interactions);
            _logger?.Log(LogLevel.Info, "Server broadcast interactions: " + interactions.FirstOrDefault());
        }

        public void Stop()
        {
            if (_server == null)
                return;

            _server.Stop();
            _logger?.Log(LogLevel.Info, "Server stopped");
        }

    }


}
