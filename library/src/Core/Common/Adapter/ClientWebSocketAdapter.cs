using System;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;
using ReFlex.Core.Common.Interfaces;

namespace ReFlex.Core.Common.Adapter
{
    public class ClientWebSocketAdapter : IClientWebSocket
    {
        private readonly ClientWebSocket _client;

        public ClientWebSocketAdapter()
        {
            _client = new ClientWebSocket();
        }

        public WebSocketState State => _client.State;
        public async Task ConnectAsync(Uri uri, CancellationToken cancellationToken)
        {
            await _client.ConnectAsync(uri, cancellationToken);
        }

        public async Task SendAsync(ArraySegment<byte> buffer, WebSocketMessageType messageType, bool endOfMessage,
            CancellationToken cancellationToken)
        {
            await _client.SendAsync(buffer, messageType, endOfMessage, cancellationToken);
        }

        public async Task CloseAsync(WebSocketCloseStatus closeStatus, string statusDescription, CancellationToken cancellationToken)
        {
            await _client.CloseAsync(closeStatus, statusDescription, cancellationToken);
        }

        public void Dispose()
        {
            _client.Dispose();
        }
    }
}