using System;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Networking.Interfaces;
using ReFlex.Core.Networking.Util;
using WatsonTcp;

namespace ReFlex.Core.Networking.Components
{
    public class NetworkServer : IServer
    {
        private readonly Guid _serverId = Guid.NewGuid();

        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        private WatsonTcpServer _server;
        private IPAddress _address;
        private int _port;

        public NetworkInterface Type => NetworkInterface.Tcp;

        public bool IsReady => _server != null;

        public bool IsStarted { get; private set; }

        public string Id => _serverId.ToString();

        public string Address
        {
            get => $"{_address}:{_port}";
            set
            { var p1 = value.IndexOf(':');

                var address = _address != null ? _address.ToString() : "";

                if (p1 > 0)
                {
                    address =  value.Substring(0, p1);
                }

                var portStr = value.Substring(p1 + 1);
                var p2 = portStr.IndexOf('/');
                if (p2 > 0)
                {
                    portStr = portStr.Substring(0, p2);
                }

                var success = int.TryParse(portStr, out var port);

                Stop();

                Init(address, port);
            }
        }

        public string Port => _port.ToString();

        public string Endpoint => "";

        public NetworkServer(string ipAddress, int port)
        {
            Init(ipAddress, port);
        }

        private void Init(string ipAddress, int port)
        {
            var success = IPAddress.TryParse(ipAddress, out _address);
            if (!success)
                throw new ArgumentOutOfRangeException($"Provided IP Address {ipAddress} is not valid for {GetType().Name}");

            _port = port;

            _server = new WatsonTcpServer(_address.ToString(), _port);
            _server.Events.MessageReceived += OnClientMessageReceived;
        }

        private void OnClientMessageReceived(object sender, MessageReceivedEventArgs e)
        {
            Logger.Debug($"client from {e.Client.IpPort} sent data: {Encoding.UTF8.GetString(e.Data)}{Environment.NewLine}.");
        }

        public void Start()
        {
            if (IsStarted)
                return;

            if (_server == null)
                Init(_address.ToString(), _port);

            if (_server == null)
                return;

            _server.Start();
            _server.Events.MessageReceived+= OnClientMessageReceived;
            IsStarted = true;
        }

        public void Stop()
        {
            if (!IsStarted || _server == null)
                return;


            _server.Events.MessageReceived-= OnClientMessageReceived;
            _server.Dispose();
            _server = null;
            IsStarted = false;
        }

        public void Broadcast(object data)
        {
            if (!IsReady || !IsStarted)
                return;

            var json = SerializationUtils.SerializeToJson(data);
            Broadcast(json);
        }

        public void Broadcast(byte[] data)
        {
            var success = Task.Run(() => BroadcastAsync(data)).GetAwaiter().GetResult();
            if (!success)
            {
              Logger.Warn($"broadcast data of length {data.Length} to {Address} failed.");
            }
        }

        public void Broadcast(string message)
        {
          var success = Task.Run(() => BroadcastAsync(message)).GetAwaiter().GetResult();
          if (!success)
          {
            Logger.Warn($"broadcast message {message} to {Address} failed.");
          }
        }

        public static byte[] Decode(string message) => Encoding.UTF8.GetBytes(message);

        private async Task<bool> BroadcastAsync(string message)
        {
          // @todo: refactor duplicate code
          var result = true;

          if (!IsReady || !IsStarted)
            return false;

          foreach (var client in _server.ListClients().ToList())
          {
            var success = await SendAsync(client.Guid, message);
            result = result && success;
          }

          return result;
        }

        private async Task<bool> BroadcastAsync(byte[] data)
        {
          var result = true;

          if (!IsReady || !IsStarted)
            return false;

          foreach (var client in _server.ListClients().ToList())
          {
            var success = await SendAsync(client.Guid, data);
            result = result && success;
          }

          return result;
        }

        private async Task<bool> SendAsync(Guid clientId,string message)
        {
            return await _server.SendAsync(clientId, message);
        }

        private async Task<bool> SendAsync(Guid clientId,byte[] data)
        {
          return await _server.SendAsync(clientId, data);
        }

    }
}
