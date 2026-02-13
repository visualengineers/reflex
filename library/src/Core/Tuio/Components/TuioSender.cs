using System;
using System.Collections.Concurrent;
using System.IO;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Runtime.Serialization.Formatters.Binary;
using System.Threading;
using System.Threading.Tasks;
using CoreOSC;
using CoreOSC.IO;
using NLog;
using ReFlex.Core.Common.Adapter;
using ReFlex.Core.Common.Interfaces;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Tuio.Interfaces;
using ReFlex.Core.Tuio.Util;

namespace ReFlex.Core.Tuio.Components
{
    public class TuioSender : ITuioSender
    {
        private static readonly Logger Log = LogManager.GetCurrentClassLogger();
        private readonly ConcurrentDictionary<string, byte> _loggedSendErrors = new ConcurrentDictionary<string, byte>();

        /// <summary>
        /// Client for sending TUIO Messages to Server using UDP
        /// </summary>
        protected UdpClient UdpClient;

        /// <summary>
        /// Client Interface for sending TUIO Messages to Server using TCP. (use <see cref="TcpClientAdapter"/> for better test abilities)
        /// </summary>
        protected ITcpClient TcpClient;

        /// <summary>
        /// Client Interface for sending TUIO Messages to Server using WebSocket protocol. (use <see cref="ClientWebSocketAdapter"/> for better test abilities)
        /// </summary>
        protected IClientWebSocket WsClient;

        private string _serverAddress;
        private int _serverPort;

        private void LogError(Exception exception)
        {
            Log.Error(exception);
        }

        private void LogErrorWithMessage(Exception exception, string message)
        {
            Log.Error(exception, message);
        }

        /// <summary>
        /// Specifies whether a valid <see cref="TuioConfiguration"/> has been provided and sending is enabled.
        /// </summary>
        public bool IsInitialized { get; protected set; }

        /// <summary>
        /// Initializes communication by instantiating clients and setting server address and port.
        /// If config has a valid <see cref="TransportProtocol"/> and server address and port are formally valid, <see cref="IsInitialized"/> is set to true.
        /// </summary>
        /// <param name="config"><see cref="TuioConfiguration"/> specifying <see cref="TransportProtocol"/>, server address and port</param>
        /// <exception cref="ArgumentException">if provided <see cref="TransportProtocol"/> has an invalid value (neither Udp, Tcp or WebSocket)</exception>
        public virtual void Initialize(TuioConfiguration config)
        {
            if (config == null || string.IsNullOrWhiteSpace(config.ServerAddress) || config.ServerPort <= 0)
            {
                Log.Warn(
                    $"Provided invalid value for initializing {nameof(TuioSender)}: Config: {config?.GetTuioConfigurationString() ?? "NULL"}");
                return;
            }

            switch (config.Transport)
            {
                case TransportProtocol.Udp:
                    UdpClient = new UdpClient(config.ServerAddress, config.ServerPort);
                    break;
                case TransportProtocol.Tcp:
                    TcpClient = new TcpClientAdapter();
                    break;
                case TransportProtocol.WebSocket:
                    WsClient = new ClientWebSocketAdapter();
                    break;
                default:
                    var msg =
                        $"Provided {nameof(TransportProtocol)} ({config.Transport}) is not valid for configuring {nameof(TuioBroadcast)}. Provided configuration: {config.GetTuioConfigurationString()}.";
                    var exc = new ArgumentException(msg);
                    Log.Error(exc, msg);
                    throw exc;
            }

            _serverAddress = config.ServerAddress;
            _serverPort = config.ServerPort;
            _loggedSendErrors.Clear();
            IsInitialized = true;
        }

        /// <summary>
        /// Send the provided data to the TUIO Server using UDP.
        /// </summary>
        /// <param name="bundle"><see cref="OscBundle"/> containing valid TUIO messages (Usually constructed by <see cref="ITuioMessageBuilder"/> implementation).</param>
        public virtual async Task SendUdp(OscBundle bundle)
        {
            try
            {
                foreach (var msg in bundle.Messages)
                {
                    await SendOscMessageUdp(msg);
                }
            }
            catch (Exception exc)
            {
                LogUtilities.LogErrorOnce(_loggedSendErrors, exc, nameof(TuioSender), nameof(SendUdp), LogError,
                    LogErrorWithMessage, "Error sending osc message via UDP");
            }
        }

        /// <summary>
        /// Send the provided data to the TUIO Server using TCP.
        /// If not connected, the method connects to the server. If connection is successful, the data is sent
        /// </summary>
        /// <param name="bundle"><see cref="OscBundle"/> containing valid TUIO messages (Usually constructed by <see cref="ITuioMessageBuilder"/> implementation).</param>
        public virtual async Task SendTcp(OscBundle bundle)
        {
            if (TcpClient?.Connected == false)
            {
                try
                {
                    await TcpClient.ConnectAsync(_serverAddress, _serverPort);
                }
                catch (Exception exc)
                {
                    LogUtilities.LogErrorOnce(_loggedSendErrors, exc, nameof(TuioSender), nameof(SendTcp), LogError,
                        LogErrorWithMessage);
                }
            }

            if (TcpClient?.Connected == true)
            {
                foreach (var msg in bundle.Messages)
                {
                    await SendOscMessageTcp(msg);
                }
            }
        }

        /// <summary>
        /// Send the provided data to the TUIO Server using WebSocket protocol.
        /// If Websocket status is not <see cref="WebSocketState.Open"/>, the method (re)connects to the server.
        /// If connection is successful, the data is sent.
        /// </summary>
        /// <param name="bundle"><see cref="OscBundle"/> containing valid TUIO messages (Usually constructed by <see cref="ITuioMessageBuilder"/> implementation).</param>
        public virtual async Task SendWebSocket(OscBundle bundle)
        {
            if (WsClient?.State != WebSocketState.Open)
            {
                var uri = new Uri($"ws://{_serverAddress}:{_serverPort}");
                try
                {
                    if (WsClient != null)
                        await WsClient.ConnectAsync(uri, CancellationToken.None);
                }
                catch (Exception exc)
                {
                    LogUtilities.LogErrorOnce(_loggedSendErrors, exc, nameof(TuioSender), nameof(SendWebSocket),
                        LogError, LogErrorWithMessage);
                }
            }

            if (WsClient?.State == WebSocketState.Open)
            {
                foreach (var msg in bundle.Messages)
                {
                    await SendOscMessageWebSocket(msg);
                }
            }
        }

        /// <summary>
        /// Wrapper method for sending messages (protected to be overridden in test classes)
        /// </summary>
        /// <param name="msg"><see cref="OscMessage"/> to be transmitted</param>
        protected virtual async Task SendOscMessageUdp(OscMessage msg)
        {
            try
            {
                await UdpClient.SendMessageAsync(msg);
            }
            catch (Exception exc)
            {
                LogUtilities.LogErrorOnce(_loggedSendErrors, exc, nameof(TuioSender), nameof(SendOscMessageUdp),
                    LogError, LogErrorWithMessage);
            }
        }

        /// <summary>
        /// Wrapper method for sending messages (protected to be overridden in test classes).
        /// Provided message is binary formatted using <see cref="BinaryFormatter"/> and written to TCP Stream.
        /// </summary>
        /// <param name="msg"><see cref="OscMessage"/> to be transmitted</param>
        protected virtual async Task SendOscMessageTcp(OscMessage msg)
        {
            var format = new BinaryFormatter();
            try
            {

                format.Serialize(TcpClient.GetStream(), msg.Address.Value);

                foreach (var arg in msg.Arguments)
                {
                    format.Serialize(TcpClient.GetStream(), arg);
                }

                await TcpClient.GetStream().FlushAsync();
            }
            catch (Exception exc)
            {
                LogUtilities.LogErrorOnce(_loggedSendErrors, exc, nameof(TuioSender), nameof(SendOscMessageTcp),
                    LogError, LogErrorWithMessage);
            }
        }

        /// <summary>
        /// Wrapper method for sending messages (protected to be overridden in test classes).
        /// Provided message is binary formatted using <see cref="BinaryFormatter"/> and
        /// written to <see cref="MemoryStream"/> which in turn is sent asynchronously via Websockets.
        /// </summary>
        /// <param name="msg"><see cref="OscMessage"/> to be transmitted</param>
        protected virtual async Task SendOscMessageWebSocket(OscMessage msg)
        {
            var mStream = new MemoryStream();
            var format = new BinaryFormatter();
            format.Serialize(mStream, msg.Address.Value);
            foreach (var arg in msg.Arguments)
            {
                format.Serialize(mStream, arg);
            }

            try
            {
                await WsClient.SendAsync(new ArraySegment<byte>(mStream.ToArray()),
                    WebSocketMessageType.Binary, true,
                    CancellationToken.None);
            }
            catch (Exception exc)
            {
                LogUtilities.LogErrorOnce(_loggedSendErrors, exc, nameof(TuioSender),
                    nameof(SendOscMessageWebSocket), LogError, LogErrorWithMessage);
            }
        }

        /// <summary>
        /// Closes and disposes all clients (if initialized).
        /// Resets <see cref="IsInitialized"/> to false.
        /// </summary>
        public virtual async Task StopAllConnections()
        {
            UdpClient?.Close();
            TcpClient?.Close();
            if (WsClient != null)
                await WsClient.CloseAsync(WebSocketCloseStatus.NormalClosure, "Close connection",
                    CancellationToken.None);

            UdpClient?.Dispose();
            TcpClient?.Dispose();
            WsClient?.Dispose();
            _loggedSendErrors.Clear();

            IsInitialized = false;
        }
    }
}
