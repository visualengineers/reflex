using System;
using NLog;
using ReFlex.Core.Networking.Interfaces;
using ReFlex.Core.Networking.Util;
using WebSocketSharp;
using Logger = NLog.Logger;

namespace ReFlex.Core.Networking.Components
{
    public class WebSocketClient : IClient, IDisposable
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        private readonly WebSocket _client;
        private readonly string _address = "";
        private readonly string _endpoint;
        private readonly int _port;

        private readonly Guid _clientId = Guid.NewGuid();

        public event EventHandler<NetworkingDataMessage> NewDataReceived;
        public bool IsInitialized { get; }
        public bool IsConnected { get; private set; }

        public NetworkInterface Type => NetworkInterface.Websockets;

        public string Address => $"{_address}:{_port}{_endpoint}";

        public string Id => _clientId.ToString();

        public WebSocketClient(string address, int port, string endpoint)
        {
            _address = address;
            _port = port;
            _endpoint = endpoint;

            _client = new WebSocket($"{_address}:{_port}{_endpoint}");
            IsInitialized = true;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="address">c</param>
        /// <param name="port"></param>
        /// <returns></returns>
        public bool Connect()
        {
            _client.Connect();
            _client.OnOpen += WebSocketOpened;
            _client.OnMessage += WebSocketMessageReceived;
            _client.OnClose += WebSocketClosed;
            _client.OnError += HandleWebSocketError;

            IsConnected = _client.ReadyState == WebSocketState.Open;

            return IsConnected;
        }

        private void WebSocketClosed(object sender, CloseEventArgs e)
        {
            Logger.Debug(
                $"WebSocket on '{_address}' closed with code {e.Code}. {Environment.NewLine}Reason: {e.Reason}, was clean ? {e.WasClean}. ClientId: {_clientId}");

            IsConnected = false;
        }


        private void HandleWebSocketError(object sender, ErrorEventArgs e)
        {
            Logger.Error(e?.Exception,
                $"{e?.Exception?.GetType()} on WebSocket on '{_address}': {e?.Message}.");

            IsConnected = false;
        }

        private void WebSocketOpened(object sender, EventArgs e)
        {
            Logger.Debug(
                $"WebSocket on '{_address}' opened. ClientId: {_clientId}.");
        }

        private void WebSocketMessageReceived(object sender, MessageEventArgs e)
        {
            Logger.Trace(
                $"WebSocket on '{_address}' received data: {Environment.NewLine}{e.Data}{Environment.NewLine}ClientId: {_clientId}{Environment.NewLine}");

            var message = new NetworkingDataMessage(e.Data, _clientId);
            OnNewDataReceived(this, message);
        }

        public void Disconnect()
        {
            Disconnect($"Client with Id {_clientId} disconnected.");

            IsConnected = false;
        }

        private void Disconnect(string message)
        {
            _client.Close(CloseStatusCode.Normal, message);
            _client.OnOpen -= WebSocketOpened;
            _client.OnMessage -= WebSocketMessageReceived;
            _client.OnClose -= WebSocketClosed;
            _client.OnError -= HandleWebSocketError;
        }

        public void OnNewDataReceived(object sender, NetworkingDataMessage message)
        {
            NewDataReceived?.Invoke(sender, message);
        }

        public void Send(NetworkingDataMessage message)
        {
            _client.Send(message.Message);
        }

        public void Dispose()
        {
            Disconnect($"App for client {_clientId} is closing.");
            ((IDisposable)_client)?.Dispose();
        }
    }
}