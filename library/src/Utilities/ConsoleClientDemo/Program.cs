using System;
using System.Configuration;
using System.Threading;
using NLog;
using ReFlex.Core.Networking.Util;

namespace ReFlex.Utilities.ConsoleClientDemo
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


            var client = new Client(_logger, type, address, port, endpoint);

            Console.WriteLine("Press Enter to connect to server.");

            Console.ReadLine();

            client.Run();

            var cancel = new CancellationToken();
            var bgService = new BackgroundSendingClientSimulator(client, _logger, port, address);

            success = bool.TryParse(ConfigurationManager.AppSettings["SendValues"], out var sendValues);

            if (success && sendValues)
                bgService.StartAsync(cancel);

            Console.ReadLine();

            if (success && sendValues)
                bgService.StopAsync(cancel);

            client.Stop();
        }
    }
}
