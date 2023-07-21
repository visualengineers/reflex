using System;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;
using Implementation.Components;
using Implementation.Interfaces;
using NLog;
using Prism.Events;
using Prism.Ioc;
using ReFlex.Core.Calibration.Components;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Interfaces;
using ReFlex.Core.Interactivity.Interfaces;
using ReFlex.Core.Interactivity.Util;
using ReFlex.Frontend.ServerWPF.Events;
using ReFlex.Frontend.ServerWPF.Properties;
using ReFlex.Frontend.ServerWPF.ViewModels;
using ReFlex.Frontend.ServerWPF.Views;

namespace ReFlex.Frontend.ServerWPF
{
    public partial class App
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        private IEventAggregator _evtAggregator;


        protected override void OnStartup(StartupEventArgs args)
        {
            base.OnStartup(args);

            SetupExceptionHandling();

            var sizeX = Settings.Default.CalibrationSizeX;
            var sizeY = Settings.Default.CalibrationSizeY;
            var startX = Settings.Default.CalibrationStartX;
            var startY = Settings.Default.CalibrationStartY;

            if (args.Args.Length >= 4)
            {
                int.TryParse(args.Args[0], out sizeX);
                int.TryParse(args.Args[1], out sizeY);
                int.TryParse(args.Args[2], out startX);
                int.TryParse(args.Args[3], out startY);
            }

            Settings.Default.CalibrationSizeX = sizeX;
            Settings.Default.CalibrationSizeY = sizeY;
            Settings.Default.CalibrationStartX = startX;
            Settings.Default.CalibrationStartY = startY;

            Settings.Default.Save();

            Logger.Info($"App startup successfully completed...");
        }

        protected override void RegisterTypes(IContainerRegistry containerRegistry)
        {
            _evtAggregator = Container.Resolve<IEventAggregator>();

            var logVm = new LogViewModel(_evtAggregator);
            containerRegistry.RegisterInstance(logVm); 
            
            var calibWidth = Settings.Default.CalibrationSizeX;
            var calibHeight = Settings.Default.CalibrationSizeY;
            var calibStartX = Settings.Default.CalibrationStartX;
            var calibStartY = Settings.Default.CalibrationStartY;

            var calibrator = new Calibrator(calibWidth, calibHeight, calibStartX, calibStartY);
            
            containerRegistry.RegisterInstance(calibrator, "Calibrator");

            containerRegistry.RegisterSingleton(typeof(IDepthImageManager), typeof(DepthImageManager));
            containerRegistry.RegisterSingleton(typeof(ITrackingManager), typeof(TrackingManager));
            containerRegistry.RegisterSingleton(typeof(IFilterManager), typeof(FilterManager));
            containerRegistry.RegisterSingleton(typeof(INetworkManager), typeof(NetworkManager));
            containerRegistry.RegisterSingleton(typeof(ICalibrationManager), typeof(CalibrationManager));
            containerRegistry.RegisterSingleton(typeof(IInteractionManager), typeof(InteractionManager));
            containerRegistry.RegisterSingleton(typeof(ITimerLoop), typeof(TimerLoop));
            containerRegistry.RegisterSingleton(typeof(IPerformanceAggregator), typeof(PerformanceAggregator));

            var savedCalibration = Settings.Default.Calibration;

            var calibrationManager = Container.Resolve<ICalibrationManager>();
            calibrationManager.Initialize(calibrator, savedCalibration);

            var savedInteractionType = Settings.Default.InteractionType;

            containerRegistry.RegisterSingleton(typeof(IRemoteInteractionProcessorService),
                typeof(MockRemoteInteractionProcessorService));
            
            var interactionManager = Container.Resolve<IInteractionManager>();
            interactionManager.Init(savedInteractionType);

            DispatcherUnhandledException += OnUnhandledException;

            Logger.Info($"Successfully registered types for application.");
        }

        protected override Window CreateShell()
        {
            return Container.Resolve<MainView>();
        }

        private void SetupExceptionHandling()
        {
            AppDomain.CurrentDomain.UnhandledException += (s, e) =>
                LogUnhandledException((Exception)e.ExceptionObject, "AppDomain.CurrentDomain.UnhandledException");

            DispatcherUnhandledException += (s, e) =>
                LogUnhandledException(e.Exception, "Application.Current.DispatcherUnhandledException");

            TaskScheduler.UnobservedTaskException += (s, e) =>
                LogUnhandledException(e.Exception, "TaskScheduler.UnobservedTaskException");

            Logger.Info($"Setup of Exception Handling succcessfully completed...");
        }

        private void LogUnhandledException(Exception exception, string source)
        {
            string message = $"Unhandled exception ({source})";
            try
            {
                System.Reflection.AssemblyName assemblyName = System.Reflection.Assembly.GetExecutingAssembly().GetName();
                message = $"Unhandled exception in {assemblyName.Name} v{assemblyName.Version}";
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "Exception in LogUnhandledException");
            }
            finally
            {
                Logger.Error(exception, message);
            }
        }

        private void OnUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
        {
            Logger.Log(LogLevel.Fatal, $"UnhandledException cuases the app to crash: {e?.Exception?.GetType()}: {e?.Exception?.Message}.");
            _evtAggregator.GetEvent<ExitApplicationEvent>().Publish();

            Current.Shutdown(-1);

        }

        protected override void OnExit(ExitEventArgs e)
        {
            Logger.Info($"App shutdown initialized.");

            _evtAggregator.GetEvent<ExitApplicationEvent>().Publish();

            base.OnExit(e);
        }
    }
}
