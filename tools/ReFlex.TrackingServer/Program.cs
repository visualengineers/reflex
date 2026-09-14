using ElectronNET.API;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using NLog;
using NLog.Config;
using NLog.Targets;
using NLog.Web;
using LogLevel = NLog.LogLevel;

namespace TrackingServer
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Logger logger;
            try
            {
              logger = LogManager.Setup()
                .LoadConfigurationFromAppSettings()
                .GetCurrentClassLogger();
            }
            catch (NLog.NLogConfigurationException configEx)
            {
              // Fallback, damit die App nicht schon beim Start wegen einer fehlerhaften NLog-Config stirbt.
              var fallbackConfig = new LoggingConfiguration();

              var consoleTarget = new ConsoleTarget("console")
              {
                Layout = "${longdate}|${level:uppercase=true}|${logger}|${message} ${exception:format=ToString}"
              };

              fallbackConfig.AddRule(LogLevel.Trace, LogLevel.Fatal, consoleTarget);
              LogManager.Configuration = fallbackConfig;

              logger = LogManager.GetCurrentClassLogger();
              logger.Error(configEx, "NLog-Konfiguration konnte nicht geladen werden. Fallback-Konfiguration wird verwendet. Bitte NLog-Config prüfen (z.B. ungültige Property 'regex' bei ConsoleWordHighlightingRule).");
            }


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
                SafeShutdownElectronAndLogging();

                Environment.Exit(1);
            }
            finally
            {
                // Ensure to flush and stop internal timers/threads before application-exit (Avoid segmentation fault on Linux)
                SafeShutdownElectronAndLogging();
            }
        }

        private static void SafeShutdownElectronAndLogging()
        {
          try
          {
            LogManager.Shutdown();
          }
          catch
          {
            // Ignore: Kill Logging with application
          }

          try
          {
            if (HybridSupport.IsElectronActive)
              Electron.App.Exit();
          }
          catch
          {
            // Ignore: Exit anyway.
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
