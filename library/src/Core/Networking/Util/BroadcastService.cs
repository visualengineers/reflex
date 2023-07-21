using NLog;
using WebSocketSharp;
using WebSocketSharp.Server;
using Logger = NLog.Logger;

namespace ReFlex.Core.Networking.Util
{
    /// <summary>
    /// specified communication service
    /// </summary>
    /// <seealso cref="WebSocketBehavior" />
    public class BroadcastService : WebSocketBehavior
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        protected override void OnMessage(MessageEventArgs e)
        {
            Send(e.Data);

            Logger?.Info($"Server received message: {e.Data}");
        }
    }
}