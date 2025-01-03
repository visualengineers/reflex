using Microsoft.AspNetCore.Mvc;
using System.Net.WebSockets;
using System.Text;
using Implementation.Interfaces;
using ReFlex.Core.Common.Components;

namespace TrackingServer.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class WebsocketController : Controller
    {
        private readonly ILogger<WebsocketController> _logger;
        private WebSocket _ws;
        private readonly ICalibrationManager _calib;

        public WebsocketController(ILogger<WebsocketController> logger, IInteractionManager interactionManager, ICalibrationManager calibrationManager)
        {
            _logger = logger;
            interactionManager.InteractionsUpdated += OnInteractionsUpdated;
            _calib = calibrationManager;
        }

        private void OnInteractionsUpdated(object? sender, IList<Interaction> e)
        {
            if (_ws == null)
                return;

            var calibrated = e.Select(raw => _calib.Calibrate(raw)).ToList();

            var msg = Encoding.UTF8.GetBytes(SerializationUtils.SerializeToJson(calibrated));
            _ws.SendAsync(new ArraySegment<byte>(msg, 0, msg.Length), WebSocketMessageType.Text, true,
                CancellationToken.None);
        }

        [HttpGet("/ReFlex")]
        public async Task Get()
        {
            if (HttpContext.WebSockets.IsWebSocketRequest)
            {
                using var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
                _ws = webSocket;
                _logger.Log(LogLevel.Information, "WebSocket connection established");
                await Echo(webSocket);
            }
            else
            {
                HttpContext.Response.StatusCode = 400;
            }
        }

        private async Task Echo(WebSocket webSocket)
        {
            var buffer = new byte[1024 * 4];
            var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
            _logger.Log(LogLevel.Information, "Message received from Client");

            while (!result.CloseStatus.HasValue)
            {
                var serverMsg = Encoding.UTF8.GetBytes($"Server: Hello. You said: {Encoding.UTF8.GetString(buffer)}");
                await webSocket.SendAsync(new ArraySegment<byte>(serverMsg, 0, serverMsg.Length), result.MessageType, result.EndOfMessage, CancellationToken.None);
                _logger.Log(LogLevel.Information, "Message sent to Client");

                result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                _logger.Log(LogLevel.Information, "Message received from Client");

            }
            await webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);
            _logger.Log(LogLevel.Information, "WebSocket connection closed");

            _ws = null;
        }
    }
}
