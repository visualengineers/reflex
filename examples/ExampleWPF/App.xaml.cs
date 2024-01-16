using System;
using System.Configuration;
using System.Linq;
using System.Windows;
using ExampleWPF.Models;
using NLog;
using Prism.Ioc;
using Prism.Unity;

namespace ExampleWPF
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : PrismApplication
    {
        private readonly Logger _logger = LogManager.GetCurrentClassLogger();
        
        protected override void RegisterTypes(IContainerRegistry containerRegistry)
        {
            try
            {
                // Open current application configuration
                var config = ConfigurationManager.OpenExeConfiguration(ConfigurationUserLevel.None);
                var section = config.AppSettings.Settings;

                var addressConfigured = section.AllKeys.Contains("ServerAddress");
                var portConfigured = int.TryParse(section["ServerPort"].Value, out var port);
                var endpointConfigured = section.AllKeys.Contains("ServerEndPoint");

                if (!(addressConfigured && portConfigured && endpointConfigured))
                {
                    throw new ApplicationException(
                        "Could not find correct configuration for server connection in app.config");
                }

                var connection =
                    new ServerConnection(section["ServerAddress"].Value, port, section["ServerEndPoint"].Value);

                containerRegistry.RegisterInstance(typeof(ServerConnection), connection);
            }
            catch (Exception exc)
            {
                _logger.Log(LogLevel.Error, exc);
            }
        }
        
        protected override Window CreateShell()
        {
            var w = Container.Resolve<MainWindow>();
            return w;
        }
    }
}