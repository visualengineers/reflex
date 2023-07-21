using System;
using System.Configuration;
using System.Threading;
using NLog;
using ReFlex.Core.Networking.Util;

namespace ReFlex.Utilities.ConsoleServerDemo
{
    class Program
    {
        private static readonly Logger _logger = LogManager.GetCurrentClassLogger();
        
        static void Main(string[] args)
        {

            var typeString = ConfigurationManager.AppSettings["NetworkInterface"];
            var success = Enum.TryParse(typeString, out NetworkInterface type);
            if (!success)
                throw new ArgumentOutOfRangeException($"cannot parse value of {typeString} as {typeof(NetworkInterface).Name}.");

            var address = ConfigurationManager.AppSettings["Address"];

            var portStr = ConfigurationManager.AppSettings["Port"];
            success = int.TryParse(portStr, out var port);

            if (!success)
                throw new ArgumentOutOfRangeException($"Provided value of {portStr} is not valid.");

            var endpoint = ConfigurationManager.AppSettings["Endpoint"];

            
            var server = new Server(_logger, type, address, port, endpoint);

            server.Run();

            var cancel = new CancellationToken();

            var bgService = new BackgroundServerSimulator(server, _logger, port);

            success = bool.TryParse(ConfigurationManager.AppSettings["SimulateBroadcast"], out var simulateBroadcast);

            if (success && simulateBroadcast)
                bgService.StartAsync(cancel);

            Console.ReadLine();
            
            if (success && simulateBroadcast)
                bgService.StopAsync(cancel);

            server.Stop();

        }
    }
}
