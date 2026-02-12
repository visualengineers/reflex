using ElectronNET.API;
using Implementation.Components;
using Implementation.Interfaces;
using Newtonsoft.Json.Serialization;
using NLog;
using NLog.Extensions.Logging;
using NLog.Targets;
using ReFlex.Core.Calibration.Components;
using ReFlex.Core.Calibration.Util;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Interfaces;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Tuio;
using ReFlex.Core.Tuio.Interfaces;
using ReFlex.Sensor.EmulatorModule;
using ReFlex.Server.Data.Version;
using TrackingServer.Events;
using TrackingServer.Hubs;
using TrackingServer.Model;
using TrackingServer.Services;
using TrackingServer.Util;
using ConfigurationManager = TrackingServer.Model.ConfigurationManager;
using LogManager = NLog.LogManager;

namespace TrackingServer
{
    public class Startup
    {
        private const string _corsPolicy = "allowLocalhostConnections";
        private readonly IWebHostEnvironment _env;
        private readonly IEventAggregator _evtAggregator;
        private readonly NLog.Logger _logger = LogManager.GetCurrentClassLogger();

        public Startup(IWebHostEnvironment env)
        {
            _logger.Trace($"Startup...");

            _logger.Debug($"Current Environment: {env.EnvironmentName}: IsDevelopment={env.IsDevelopment()}");

            var settingsFile = $"appsettings.{env.EnvironmentName}.json";

            _logger.Debug($"using settings file {settingsFile}.");

            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                .AddEnvironmentVariables();

            Configuration = builder.AddCommandLine(Environment.GetCommandLineArgs()).Build();

            _logger.Info($"Current Configuration: {Configuration}");

            _env = env;
            _evtAggregator = new EventAggregator();

            // // make NLog DI aware
            // ConfigurationItemFactory.Default.CreateInstance = type =>
            //     type == typeof(LogEventAggregatorTarget)
            //         ? new LogEventAggregatorTarget(_evtAggregator)
            //         : Activator.CreateInstance(type);

            LogManager.Setup().SetupExtensions(ext => {
                ext.RegisterTarget(() => new LogEventAggregatorTarget(_evtAggregator));
            });

            _logger.Trace($"Configured NLog for DI");

            LogManager.Configuration = new NLogLoggingConfiguration(Configuration.GetSection("NLog"));

            // Reload Configuration to make changes work
            LogManager.Configuration = LogManager.Configuration.Reload();
            _logger.Trace($"Reloaded NLog configuration");

            _logger.Trace($"Request Load App Settings");
            _evtAggregator.GetEvent<RequestLoadSettingsEvent>().Publish();
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            _logger.Trace($"Configure Services...");

            services.AddCors(options => {
                options.AddDefaultPolicy(builder =>
                {
                    builder.SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost")
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
            });


            services.AddControllersWithViews().AddNewtonsoftJson(op =>
                op.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver());
            _logger.Trace($"Configured Json Serialization Properties...");

            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles(configuration => { configuration.RootPath = "ClientApp/dist"; });

            services.AddSignalR(configure => { configure.EnableDetailedErrors = true; });
            _logger.Trace($"Configured SignalR");

            services.AddGrpc(options =>
            {
                options.MaxReceiveMessageSize = 8 * 1024 * 1024; // 8 MB
                options.MaxSendMessageSize = 8 * 1024 * 1024; // 8 MB
            });
            _logger.Trace($"Configured gRPC...");

            ConfigureTrackingServices(services);
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            _logger.Trace($"Configuring HTTP request pipeline for application...");

            app.UseCors();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpContext();

            // we use insecure gRpc communication - therefore redirection is not possible (redirection is always site-wide
            // app.UseHttpsRedirection();
            _logger.Trace($"Disabling HTTPS redirection for compatibility with gRPC services.");


            app.UseStaticFiles();
            if (!env.IsDevelopment())
            {
                app.UseSpaStaticFiles();
            }

            var webSocketOptions = new WebSocketOptions()
            {
                KeepAliveInterval = TimeSpan.FromSeconds(120)
            };

            app.UseRouting();
            _logger.Trace($"Configured Routing");

            app.UseWebSockets(webSocketOptions);
            _logger.Trace($"Configured WebSockets");

            app.UseStreamSocket();
            _logger.Trace($"Configured StreamSockets");

            app.UseDepthImageReceiverSocket();
            _logger.Trace($"Configured DepthImageReceiverSocket");

            _logger.Trace($"Configuring endpoints...");
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapHub<PointCloudHub>("/pointcloudhub");
                _logger.Trace($"Registered endpoint '/pointcloudhub' for {typeof(PointCloudHub).FullName}.");

                endpoints.MapHub<TrackingHub>("/trkhub");
                _logger.Trace($"Registered endpoint '/trkhub' for {typeof(TrackingHub).FullName}.");

                endpoints.MapHub<ProcessingHub>("/prochub");
                _logger.Trace($"Registered endpoint '/prochub' for {typeof(ProcessingHub).FullName}.");

                endpoints.MapHub<NetworkingHub>("/nethub");
                _logger.Trace($"Registered endpoint '/nethub' for {typeof(NetworkingHub).FullName}.");

                endpoints.MapHub<CalibrationHub>("/calibhub");
                _logger.Trace($"Registered endpoint '/calibhub' for {typeof(CalibrationHub).FullName}.");

                endpoints.MapHub<PerformanceHub>("/perfhub");
                _logger.Trace($"Registered endpoint '/perfhub' for {typeof(PerformanceHub).FullName}.");

                endpoints.MapHub<TuioHub>("/tuiohub");
                _logger.Trace($"Registered endpoint '/tuiohub' for {typeof(TuioHub).FullName}.");

                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller}/{action=Index}/{id?}");
                _logger.Trace($"Registered defualt controller routes follwoing pattern: '{{controller}}/{{action=Index}}/{{id?}}'.");

                endpoints.MapGrpcService<GreeterService>();
                _logger.Trace($"Registered gRPC Service for {typeof(GreeterService).FullName}.");

            });

            app.UseSpa(spa =>
            {
                // To learn more about options for serving an Angular SPA from ASP.NET Core,
                // see https://go.microsoft.com/fwlink/?linkid=864501

                spa.Options.SourcePath = "ClientApp";

                if (env.IsDevelopment())
                {
                    // spa.UseAngularCliServer(npmScript: "start");
                    spa.UseProxyToSpaDevelopmentServer("http://localhost:4200");
                }
            });

            _logger.Trace($"Initialize services...");

            var serviceProvider = app.ApplicationServices;
            serviceProvider.GetService<ProcessingService>()?.Init();
            _logger.Trace($"Initialized {typeof(ProcessingService).FullName}.");

            serviceProvider.GetService<NetworkingService>()?.Init();
            _logger.Trace($"Initialized {typeof(NetworkingService).FullName}.");

            serviceProvider.GetService<TrackingService>()?.Init();
            _logger.Trace($"Initialized {typeof(TrackingService).FullName}.");

            serviceProvider.GetService<TuioService>()?.Init();
            _logger.Trace($"Initialized {typeof(TuioService).FullName}.");

            serviceProvider.GetService<SettingsService>()?.Init();
            _logger.Trace($"Initialized {typeof(SettingsService).FullName}.");

            // if development mode / when running as web app: disable electron (set as commandLineArg in launchSettings.json
            if (Configuration.GetValue<bool>("DisableElectron"))
            {
                _logger.Warn("Electron is disabled due to Command Line Parameter `/DisableElectron=true`");
                return;
            }
            try {

                Electron.App.CommandLine.AppendSwitch("disable-http-cache");
                Electron.App.CommandLine.AppendSwitch("ignore-certificate-errors", "true");

                _logger.Trace($"Configured Electron Options");

                _logger.Trace($"Open Electron Window");
            }
            catch (Exception exc) {
                _logger.Error(exc,$"Error when configuraing app: {exc.Message}");
            }

            // Open the Electron-Window here
            Task.Run(async () =>
            {
                try
                {
                    var window = await Electron.WindowManager.CreateWindowAsync();
                    window.SetFullScreen(true);
                    window.SetAutoHideMenuBar(true);
                }
                catch (Exception e)
                {
                    _logger.Error(e,$"Close Electron windows due to Error: {e.Message}");
                    Electron.App.Exit();
                }
            });
        }

        private void ConfigureTrackingServices(IServiceCollection services)
        {
            var logService = new LogDataProviderService(_evtAggregator);
            _logger.Trace($"Created {typeof(LogDataProviderService).FullName} instance.");

            var path = Configuration.GetSection("TrackingServerAppSettings").Value ?? "";
            var defaultPath = Configuration.GetSection("TrackingServerAppSettings_Default").Value ?? "";
            var backupPath = Configuration.GetSection("TrackingServerAppSettings_Backup").Value ?? "";
            var configManager = new ConfigurationManager(_env, _evtAggregator, path, defaultPath, backupPath);
            _logger.Trace($"Created {typeof(ConfigurationManager).FullName} instance.");

            var settings = configManager.Settings;

            services.AddSingleton(configManager);
            _logger.Trace($"Sucessfully registered {typeof(ConfigurationManager).FullName} [Singleton].");

            var remoteProcessor = new RemoteInteractionProcessingService(configManager, _evtAggregator);
            services.AddSingleton(remoteProcessor);
            _logger.Trace($"Sucessfully registered {typeof(RemoteInteractionProcessingService).FullName} [Singleton].");

            var performanceAggregator = new PerformanceAggregator();
            services.AddSingleton<IPerformanceAggregator>(performanceAggregator);
            _logger.Trace($"Sucessfully registered {typeof(IPerformanceReporter).FullName} [Singleton].");

            var filterManager = new FilterManager
            {
                DefaultDistance = settings.FilterSettingValues.DistanceValue.Default
            };
            performanceAggregator.RegisterReporter(filterManager);
            _logger.Trace($"Created {typeof(FilterManager).FullName} instance.");

            // if (settings?.FilterSettingValues?.FilterMask != null)
            //     filterManager.Init(settings.FilterSettingValues.FilterMask);

            var depthImageManager = new DepthImageManager(filterManager);
            _logger.Trace($"Created {typeof(DepthImageManager).FullName} instance.");

            var networkManager = new NetworkManager(_evtAggregator);
            _logger.Trace($"Created {typeof(NetworkManager).FullName} instance.");

            var interactionManager = new InteractionManager(depthImageManager, remoteProcessor, performanceAggregator);
            var type = settings?.ProcessingSettingValues.InteractionType ?? ObserverType.None;
            interactionManager.Init(type);

            _logger.Trace($"Created {typeof(InteractionManager).FullName} instance.");

            var calibrator = new Calibrator();
            _logger.Trace($"Created {typeof(Calibrator).FullName} instance.");

            var calibManager = new CalibrationManager();
            calibManager.Initialize(calibrator, settings?.CalibrationValues ?? new Calibration());
            _logger.Trace($"Created {typeof(CalibrationManager).FullName} instance.");

            var timerLoop = new TimerLoop(networkManager, interactionManager, calibManager);
            _logger.Trace($"Created {typeof(TimerLoop).FullName} instance.");

            services.AddSingleton<Calibrator>(calibrator);
            _logger.Trace($"Sucessfully registered {typeof(Calibrator).FullName} [Singleton].");

            services.AddSingleton<IEventAggregator>(_evtAggregator);
            _logger.Trace($"Sucessfully registered {typeof(IEventAggregator).FullName} [Singleton].");

            services.AddSingleton<IDepthImageManager>(depthImageManager);
            _logger.Trace($"Sucessfully registered {typeof(IDepthImageManager).FullName} [Singleton].");

            services.AddSingleton<IFilterManager>(filterManager);
            _logger.Trace($"Sucessfully registered {typeof(IFilterManager).FullName} [Singleton].");

            services.AddSingleton<INetworkManager>(networkManager);
            _logger.Trace($"Sucessfully registered {typeof(INetworkManager).FullName} [Singleton].");

            services.AddSingleton<ICalibrationManager>(calibManager);
            _logger.Trace($"Sucessfully registered {typeof(ICalibrationManager).FullName} [Singleton].");

            services.AddSingleton<IInteractionManager>(interactionManager);
            _logger.Trace($"Sucessfully registered {typeof(IInteractionManager).FullName} [Singleton].");

            services.AddSingleton<ITimerLoop>(timerLoop);
            _logger.Trace($"Sucessfully registered {typeof(ITimerLoop).FullName} [Singleton].");

            services.AddSingleton<LogDataProviderService>(logService);
            _logger.Trace($"Sucessfully registered {typeof(LogDataProviderService).FullName} [Singleton].");

            services.AddSingleton<PerformanceService>();
            _logger.Trace($"Sucessfully registered {typeof(PerformanceService).FullName} [Singleton].");

            services.AddSingleton<PointCloudService>();
            _logger.Trace($"Sucessfully registered {typeof(PointCloudService).FullName} [Singleton].");

            services.AddSingleton<TrackingService>();
            _logger.Trace($"Sucessfully registered {typeof(TrackingService).FullName} [Singleton].");

            services.AddSingleton<ProcessingService>();
            _logger.Trace($"Sucessfully registered {typeof(ProcessingService).FullName} [Singleton].");

            services.AddSingleton<NetworkingService>();
            _logger.Trace($"Sucessfully registered {typeof(NetworkingService).FullName} [Singleton].");

            services.AddSingleton<CalibrationService>();
            _logger.Trace($"Sucessfully registered {typeof(CalibrationService).FullName} [Singleton].");

            services.AddSingleton<ITrackingManager>(new TrackingManager(_evtAggregator, depthImageManager));
            _logger.Trace($"Sucessfully registered {typeof(ITrackingManager).FullName} [Singleton].");

            services.AddSingleton(new CameraManager());
            _logger.Trace($"Sucessfully registered {typeof(CameraManager).FullName} [Singleton].");

            services.AddSingleton<DepthStreamRecorder>();
            _logger.Trace($"Sucessfully registered {typeof(DepthStreamRecorder).FullName} [Singleton].");

            services.AddSingleton<VersionInfoStore>();
            _logger.Trace($"Sucessfully registered {typeof(VersionInfoStore).FullName} [Singleton].");

            services.AddSingleton<DepthImageService>(new DepthImageService(depthImageManager, _evtAggregator));
            _logger.Trace($"Sucessfully registered {typeof(DepthImageService).FullName} [Singleton].");

            services.AddSingleton<ITuioBroadcast>(new TuioBroadcast());

            services.AddSingleton<TuioService>();
            _logger.Trace($"Sucessfully registered {typeof(TuioService).FullName} [Singleton].");

            services.AddSingleton<SettingsService>();
            _logger.Trace($"Sucessfully registered {typeof(SettingsService).FullName} [Singleton].");

            _logger.Info($"Sucessfully registered Types for server application.");

            // if (configManager.Settings.IsAutoStartEnabled)
            //     _evtAggregator.GetEvent<RequestServiceRestart>().Publish();
        }
    }
}
