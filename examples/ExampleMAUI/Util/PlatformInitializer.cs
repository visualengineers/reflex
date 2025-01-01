using System.Configuration;
using ExampleMAUI.Models;
using NLog;

namespace ExampleMAUI.Util;

public static class PlatformInitializer
{
  private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

  public static void RegisterTypes(IContainerRegistry containerRegistry)
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
      Logger.Log(LogLevel.Error, exc);
    }
  }
}
