using System;
using System.Text;
using System.Threading.Tasks;
using NLog;
using ReFlex.Core.Networking.Interfaces;
using ReFlex.Core.Networking.Util;
using WatsonTcp;

namespace ReFlex.Core.Networking.Components
{
    public class NetworkClient : IClient
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        private readonly Guid _clientId = Guid.NewGuid();

        private readonly string _address = "";
        private readonly int _port;
        private WatsonTcpClient _networkClient;

        public event EventHandler<NetworkingDataMessage> NewDataReceived;
        public bool IsInitialized { get; private set; }
        public bool IsConnected { get; private set; }

        public NetworkInterface Type => NetworkInterface.Tcp;

        public string Id => _clientId.ToString();

        public string Address => $"{_address}:{_port}";

        public NetworkClient(string address, int port)
        {
            _address = address;
            _port = port;
            Init();
        }

        private void Init()
        {
            _networkClient = new WatsonTcpClient(_address, _port);
            _networkClient.Events.MessageReceived += OnNewDataReceived;
            _networkClient.Events.ServerConnected += OnConnected;
            _networkClient.Events.ServerDisconnected += OnDisconnected;
            IsInitialized = _networkClient != null;
        }

        private void OnDisconnected(object sender, EventArgs e)
        {
            IsConnected = false;
        }

        private void OnConnected(object sender, EventArgs e)
        {
            IsConnected = true;
        }

        public bool Connect()
        {
            if (IsConnected)
                return true;

            try
            {
                _networkClient.Connect();
                return true;
            }
            catch (Exception e)
            {
                Logger.Error(e);
            }

            return false;
        }

        public void Disconnect()
        {
            _networkClient.Dispose();
            _networkClient.Events.MessageReceived -= OnNewDataReceived;
            _networkClient.Events.ServerConnected -= OnConnected;
            _networkClient.Events.ServerDisconnected -= OnDisconnected;
            _networkClient = null;

            IsConnected = false;
            IsInitialized = false;
        }

        public void OnNewDataReceived(object sender, NetworkingDataMessage message) =>
            NewDataReceived?.Invoke(sender, message);

        public void Send(NetworkingDataMessage message)
        {
          var result = Task.Run(() => _networkClient.SendAsync(message.Message)).GetAwaiter().GetResult();
          if (result == false)
          {
            Logger.Warn($"Sending message {message.Message} to server {_address}:{_port} failed.");
          }
        }

        public void OnNewDataReceived(object sender, MessageReceivedEventArgs evtData)
        {
            var rawData = evtData.Data;
            var message = Encoding.UTF8.GetString(rawData);
            NewDataReceived?.Invoke(sender, new NetworkingDataMessage(message, _clientId));
        }
        public static string Encode(byte[] data) => Encoding.UTF8.GetString(data);
    }
}
