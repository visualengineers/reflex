using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Util.Threading;

namespace ReFlex.Utilities.ConsoleServerDemo
{
    public class BackgroundServerSimulator : BackgroundService
    {
        private readonly Server _server;
        private readonly int _port;
        private readonly Logger _logger;
        private int _numMessages = 0;
       
        public BackgroundServerSimulator(Server server, Logger logger, int port)
        {
            _server = server;
            _logger = logger;
            _port = port;

        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var numMessagesDelivered = await SimulateServerMessage();
                _logger.Log( LogLevel.Info, $"Server sent message Nr. {numMessagesDelivered}.");
            }
        }

        private async Task<int> SimulateServerMessage()
        {
            var rand = new Random();
            var pt = new Point3((float) rand.NextDouble() * 1920.0f, (float) rand.NextDouble() * 1080.0f,
                (float) rand.NextDouble() * 2 - 1);

            var type = pt.Z < 0 ? InteractionType.Push : InteractionType.Pull;
            
            var interaction = new Interaction(pt, type, 1f);

            _server.Broadcast(new List<Interaction>{interaction});

            var success = await Task.Run(() =>
            {
                Thread.Sleep(1000);
                return true;
            });

            if (success)
                _numMessages++;

            return _numMessages;
        }
    }
}
