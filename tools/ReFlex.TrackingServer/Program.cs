using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using ElectronNET.API;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NLog;
using NLog.Web;

namespace TrackingServer
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var logger = LogManager.Setup()
                .LoadConfigurationFromAppSettings()
                .GetCurrentClassLogger();
            try
            {
                logger.Debug("init main");
                var app = CreateHostBuilder(args).Build();
                app.Run();

            }
            catch (Exception exception)
            {
                //NLog: catch setup errors
                
                logger?.Error(exception, "Stopped program because of exception during startup..");
                logger?.Error(exception, "Shutting down Electron App...");
                NLog.LogManager.Shutdown();
                Electron.App.Exit();
                
                Environment.Exit(1);
            }
            finally
            {
                // Ensure to flush and stop internal timers/threads before application-exit (Avoid segmentation fault on Linux)
                NLog.LogManager.Shutdown();
                Electron.App.Exit();
            }
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((hostingContext, config) =>
                {
                    config.AddCommandLine(args);
                })
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder
                        .UseStartup<Startup>()
                        .ConfigureKestrel(options =>
                        {
                            // use secure communication for port 5000
                            options.ListenLocalhost(5000, configure => configure.Protocols = HttpProtocols.Http1);
                            
                            // use secure communication for port 8001
                            options.ListenLocalhost(5001, configure => configure.UseHttps());
                            
                            // setup port 5002 for insecure gRpc communication
                            options.ListenLocalhost(5002, o => o.Protocols =
                                 HttpProtocols.Http2);
                        })
                        .UseElectron(args)
                        .UseUrls("https://localhost:5002");
                    ;
                }).ConfigureLogging(logging =>
                {
                    logging.ClearProviders();
                    logging.SetMinimumLevel(Microsoft.Extensions.Logging.LogLevel.Trace);
                })
                .UseNLog();  // NLog: Setup NLog for Dependency injection
    }
}
