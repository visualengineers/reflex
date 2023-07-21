using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CommandLine;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Tuio;
using ReFlex.Core.Tuio.Components;
using ReFlex.Core.Tuio.Util;

namespace TuioTestClientConsole
{
    class Program
    {
        private static async Task Main(string[] args)
        {
            Console.WriteLine("Broadcast ReFlex Interactions using TUIO Protocol");

            var interpretation = TuioInterpretation.TouchPoint2DwithPressure;
            var protocol = ProtocolVersion.TUIO_VERSION_1_1;
            var transport = TransportProtocol.Udp;

            Parser.Default.ParseArguments<ProgramOptions>(args)
                .WithParsed<ProgramOptions>(o =>
                {
                    if (o.Interpretation == null)
                    {
                        Console.WriteLine("Specify TUIO Interpretation: [0] Point3D [1] 2.5DPoint with Pressure");

                        interpretation = Equals(Console.ReadLine()?.Trim(), "0")
                            ? TuioInterpretation.Point3D
                            : TuioInterpretation.TouchPoint2DwithPressure;
                    }
                    else
                    {
                        interpretation = o.Interpretation.Value;
                    }

                    if (o.Protocol == null)
                    {
                        Console.WriteLine("Specify TUIO Protocol version: [0] TUIO 1.1 [1] TUIO 2.0");

                        protocol = Equals(Console.ReadLine()?.Trim(), "0")
                            ? ProtocolVersion.TUIO_VERSION_1_1
                            : ProtocolVersion.TUIO_VERSION_2_0;
                    }
                    else
                    {
                        protocol = o.Protocol.Value;
                    }

                    if (o.Transport == null)
                    {
                        Console.WriteLine("Specify transport protocol: [0] UDP [1] TCP [2] WebSockets");

                        var input = Console.ReadLine()?.Trim();

                        if (Equals(input, "0"))
                            transport = TransportProtocol.Udp;
                        else if (Equals(input, "1"))
                            transport = TransportProtocol.Tcp;
                        else if (Equals(input, "2"))
                            transport = TransportProtocol.WebSocket;
                    }
                    else
                    {
                        transport = o.Transport.Value;
                    }
                });

            var broadcast = new TuioBroadcast();
            var config = new TuioConfiguration
            {
                Interpretation = interpretation,
                Protocol = protocol,
                Transport = transport,
                SensorDescription = "AzureKinect",
                SensorHeight = 480,
                SensorWidth = 640,
                ServerAddress = "127.0.0.1",
                ServerPort = 3333,
                SessionId = DateTime.Now.Millisecond
            };

            await broadcast.Configure(config);

            Console.WriteLine(
                $"Configured {nameof(TuioBroadcast)} with Configuration: {Environment.NewLine}{broadcast.Configuration.GetTuioConfigurationString()}");

            Console.WriteLine("Start Broadcasting...");

            var rand = new Random();
            var doContinue = true;
            var frame = 0;
            while (doContinue)
            {
                var x = rand.NextDouble();
                var y = rand.NextDouble();
                var z = rand.NextDouble();

                var interaction = new Interaction(new Point3((float)x, (float)y, (float)z),
                    InteractionType.None, 10.0f)
                {
                    TouchId = 2
                };

                Console.WriteLine($"[{frame}]: {interaction}");

                broadcast.Broadcast(new List<Interaction> { interaction });

                await Task.Run(() => Thread.Sleep(300));

                frame++;
            }
        }
    }
}