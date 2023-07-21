using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Util.Threading;

namespace ReFlex.Utilities.ConsoleClientDemo
{
    public class BackgroundSendingClientSimulator : BackgroundService
    {
        private readonly Client _client;
        private readonly int _port;
        private readonly string _address;
        private readonly Logger _logger;
        private int _numMessages = 0;

        public BackgroundSendingClientSimulator(Client client, Logger logger, int port, string address)
        {
            _client = client;
            _logger = logger;
            _port = port;
            _address = address;

        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var numMessagesDelivered = await SimulateServerMessage();
                _logger.Log(LogLevel.Info, $"Client sent message Nr. {numMessagesDelivered}.");
            }
        }

        private async Task<int> SimulateServerMessage()
        {
            var rand = new Random();
            var pt = new Point3((float)rand.NextDouble() * 640, (float)rand.NextDouble() * 480.0f,
               (float)rand.NextDouble() * 2 - 1);

            var type = pt.Z < 0 ? InteractionType.Push : InteractionType.Pull;

            var interaction = new Interaction(pt, type, 1f);

            var message = SerializationUtils.SerializeToJson(new List<Interaction> {interaction});

            _client.Send(message);

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
