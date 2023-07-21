using System;
using NLog;
using ReFlex.Core.Networking.Event;
using WebSocketSharp;
using WebSocketSharp.Server;
using Logger = NLog.Logger;

namespace ReFlex.Core.Networking.Util
{
    public class EmulatorService : WebSocketBehavior
    {
        public event EventHandler Closed;
        
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        public event EventHandler<InteractionsReceivedEventArgs> InteractionsReceived;

        protected override void OnMessage(MessageEventArgs e)
        {
            base.OnMessage(e);
            // Logger.Trace($"Message received: {e.Data}{Environment.NewLine}IsText ? {e.IsText}");

            InteractionsReceived?.Invoke(this, new InteractionsReceivedEventArgs(this, e.Data));
        }
        
        protected override void OnClose(CloseEventArgs e)
        {
            base.OnClose(e);
            Logger?.Warn($"[{GetType().Name}]: Websocket closed. {Environment.NewLine}Code: {e.Code}, Reason: {e.Reason} {Environment.NewLine}was clean? {e.WasClean}.");
            Closed?.Invoke(this, null);
        }

        protected override void OnError(ErrorEventArgs e)
        {
            base.OnError(e);
            Logger.Error($"[{GetType().Name}]:Websocket error.{Environment.NewLine}{e.Exception?.GetType()?.Name}:{e.Exception?.Message}{Environment.NewLine}Message: {e.Message}");
        }

        protected override void OnOpen()
        {
            base.OnOpen();
            Logger.Info($"[{GetType().Name}]:Websocket opened.");
        }
    }
}
