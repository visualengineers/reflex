using System;
using System.Collections.Generic;
using System.ComponentModel;
using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Networking.Components;
using ReFlex.Core.Networking.Interfaces;
using ReFlex.Core.Networking.Util;

namespace ReFlex.Utilities.ConsoleClientDemo
{
    public class Client
    {
        private readonly IClient _client;
        private readonly Logger _logger ;

        public Client(Logger loggerNetworkInterface, NetworkInterface type, string address, int port, string endpoint)
        {
            switch (type)
            {
                case NetworkInterface.None:
                    throw new InvalidEnumArgumentException("Do not try to create a server with type 'None'.");
                case NetworkInterface.Websockets:
                    _client = new WebSocketClient($"ws://{address}", port, endpoint);
                    break;
                case NetworkInterface.Tcp:
                    _client = new NetworkClient(address, port);
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(type), type, $"Unsupported Server type: {Enum.GetName(typeof(NetworkInterface), type)}.");
            }
            _logger = loggerNetworkInterface;
            _client.NewDataReceived += HandleDataReceived;

        }

        private void HandleDataReceived(object sender, NetworkingDataMessage message)
        {
            if (string.IsNullOrWhiteSpace(message?.Message))
                return;

            var interactions = SerializationUtils.DeserializeFromJson<List<Interaction>>(message.Message);
            if (interactions == null)
            {
                _logger.Log(LogLevel.Info, $"Received invalid Package: {Environment.NewLine}{message.Message}{Environment.NewLine}");
            }
                

            _logger.Log(LogLevel.Info, $"Received DataPackage from server containing {interactions?.Count} interactions: ");
            interactions?.ForEach(interaction =>
            {
                var timeString = DateTime.FromFileTimeUtc(interaction.Time).ToShortTimeString();
                _logger.Log(LogLevel.Info, $"{timeString} - [{interaction.Position.X} | {interaction.Position.Y} | {interaction.Position.Z} ] {Environment.NewLine} Type: {interaction.Type}, Confidence: {interaction.Confidence}{Environment.NewLine}");
            });

        }

        public void Run()
        {
            _client?.Connect();
            _logger?.Log(LogLevel.Info, $"Client connected successfully to server at {_client?.Address}.");
        }

        public void Send(string message)
        {
            _client?.Send(new NetworkingDataMessage(message, Guid.Parse(_client.Id)));
            _logger?.Log(LogLevel.Info, $"Client sent message to server at {_client?.Address}.");
        }

        public void Stop()
        {
            _client?.Disconnect();
            _logger?.Log(LogLevel.Info, $"Client disconnected from server.");
        }

    }
}
