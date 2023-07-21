using System;
using System.Net;
using System.Text;
using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Networking.Interfaces;
using ReFlex.Core.Networking.Util;
using WebSocketSharp.Server;
using Logger = NLog.Logger;

namespace ReFlex.Core.Networking.Components
{
    /// <summary>
    /// Can broadcast messages or objects to connected clients via http protocol.
    /// </summary>
    /// <seealso cref="IServer" />
    /// <inheritdoc />
    public class WebSocketServer : IServer, IDisposable
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        protected HttpServer Server;
        private IPAddress _address;
        private readonly Guid _serverId = Guid.NewGuid();

        protected int Port { get; private set; }

        protected string Endpoint { get; private set; }

        public NetworkInterface Type => NetworkInterface.Websockets;

        /// <summary>
        /// Gets a value indicating whether this instance is ready.
        /// </summary>
        /// <value>
        ///   <c>true</c> if this instance is ready; otherwise, <c>false</c>.
        /// </value>
        /// <inheritdoc />
        public bool IsReady => Server != null;

        /// <summary>
        /// Gets a value indicating whether this instance is started.
        /// </summary>
        /// <value>
        ///   <c>true</c> if this instance is started; otherwise, <c>false</c>.
        /// </value>
        public bool IsStarted { get; private set; }


        public string Id => _serverId.ToString();

        public string Address
        {
            get => $"{_address}:{Port}{Endpoint}";
            set
            {
                var p1 = value.IndexOf(':');
                var ipAddress = _address.ToString();
                
                if (p1 > 0)
                {
                   ipAddress =  value.Substring(0, p1);
                }

                var portAndEndpoint = value.Substring(p1 + 1);
                var p2 = portAndEndpoint.IndexOf('/');
                var success = int.TryParse(portAndEndpoint.Substring(0, p2), out var port);
                var endpoint = portAndEndpoint.Substring(p2);
                
                Stop();
                
                Init(ipAddress, port, endpoint);
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="ipAddress">the ip address of the server</param>
        /// <param name="endpoint">the path for the websocket (e.g. "/MyService")</param>
        public WebSocketServer(string ipAddress, int port, string endpoint)
        {   
            Init(ipAddress, port, endpoint);
        }

        private void Init(string ipAddress, int port, string endpoint)
        {
            Port = port;
            IsStarted = false;
            var success = IPAddress.TryParse(ipAddress, out _address);
            if (!success)
                throw new ArgumentOutOfRangeException($"Provided IP Address {ipAddress} is not valid for {GetType().Name}");

            Endpoint = endpoint;
        }

        /// <summary>
        /// Starts the websocket using the specified port.
        /// </summary>
        /// <param name="port">The port.</param>
        /// <inheritdoc />
        public void Start()
        {
            if (IsStarted)
                return;

            Server = new HttpServer(_address, Port);
            InitServices();           

            Server.OnGet += OnGet;
            
            try {

            Server.Start();
            IsStarted = true;

            } catch (Exception exc) {
                Logger.Error(exc, $"{exc.GetType().Name} when starting {GetType().Name}: {exc?.Message}{Environment.NewLine}{exc?.Data}.");
            }

        }

        /// <summary>
        /// Stops this instance.
        /// </summary>
        /// <inheritdoc />
        public void Stop()
        {
            if (!IsStarted)
                return;

            
            Server?.Stop();
            if (Server != null)
                Server.OnGet -= OnGet;
            IsStarted = false;
        }

        /// <summary>
        /// Broadcasts the specified data.
        /// </summary>
        /// <param name="data">The data.</param>
        /// <inheritdoc />
        public void Broadcast(object data)
        {
            if (IsReady && IsStarted)
                Broadcast(SerializationUtils.SerializeToJson(data));
        }

        /// <summary>
        /// Broadcasts the specified data.
        /// </summary>
        /// <param name="data">The data.</param>
        /// <inheritdoc />
        public void Broadcast(byte[] data)
        {
            if (IsReady && IsStarted)
                Server?.WebSocketServices?.Broadcast(data);
        }

        /// <summary>
        /// Broadcasts the specified data.
        /// </summary>
        /// <param name="data">The data.</param>
        /// <inheritdoc />
        public void Broadcast(string data)
        {
            if (IsReady && IsStarted)
                Server?.WebSocketServices?.Broadcast(data);
        }

        protected virtual void InitServices()
        {
            Server.AddWebSocketService<BroadcastService>(Endpoint);
        }

        /// <summary>
        /// Called when [get].
        /// </summary>
        /// <param name="sender">The sender.</param>
        /// <param name="args">The <see cref="HttpRequestEventArgs"/> instance containing the event data.</param>
        private static void OnGet(object sender, HttpRequestEventArgs args)
        {
            var request = args.Request;
            var response = args.Response;

            var path = request.RawUrl;
            if (path == "/")
                path += "index.html";

            if (path.EndsWith(".html"))
            {
                response.ContentType = "text/html";
                response.ContentEncoding = Encoding.UTF8;
            }
            else if (path.EndsWith(".js"))
            {
                response.ContentType = "application/javascript";
                response.ContentEncoding = Encoding.UTF8;
            }
        }
        
        public void Dispose()
        {
            Server?.Stop();
        }
    }
}
