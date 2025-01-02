using System.Configuration;
using ExampleMAUI.Models;
using ExampleMAUI.ViewModels;
using NLog;

namespace ExampleMAUI.Util;

public static class PlatformInitializer
{
  public static void RegisterTypes(IContainerRegistry containerRegistry, Logger logger)
  {
    logger.Info("RegisterTypes for Application");

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

      logger.Info($"Successfully loaded config from App.config: {config}");

      var connection =
        new ServerConnection(section["ServerAddress"].Value, port, section["ServerEndPoint"].Value);

      containerRegistry.RegisterInstance(typeof(ServerConnection), connection);

      logger.Info($"Using ServerConnection: {connection.ServerAddress}");

      ViewModelLocationProvider.Register<MainPage, MainViewModel>();

      // containerRegistry.RegisterForNavigation<MainPage, MainViewModel>();
    }
    catch (Exception exc)
    {
      logger.Log(LogLevel.Error, exc);
    }
  }
}
