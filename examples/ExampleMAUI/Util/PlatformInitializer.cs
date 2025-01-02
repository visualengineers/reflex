using System.Configuration;
using ExampleMAUI.Model.Configuration;
using ExampleMAUI.Models;
using ExampleMAUI.ViewModels;
using Microsoft.Extensions.Configuration;
using NLog;

namespace ExampleMAUI.Util;

public static class PlatformInitializer
{
  public static async Task<bool> RegisterTypes(MauiAppBuilder builder, Logger logger)
  {
    logger.Info("RegisterTypes for Application");

    var success = true;

    try
    {
      const string settingsResourceName = "appsettings.json";

      logger.Info($"Load configuration from {settingsResourceName}");

      await using var stream = await FileSystem.OpenAppPackageFileAsync(settingsResourceName);

      if (stream == null)
      {
        throw new FileNotFoundException(
          $"Could extract embedded resource {settingsResourceName}");
      }

      var config = new ConfigurationBuilder()
        .AddJsonStream(stream)
        .Build();

      if (config == null)
      {
        throw new ApplicationException(
          $"Could not find correct configuration for server connection in {settingsResourceName}");
      }

      logger.Info($"Successfully loaded config from {settingsResourceName}: {config}");

      var cfgValues = config.GetRequiredSection(nameof(ServerConnectionConfig)).Get<ServerConnectionConfig>();

      if (cfgValues == null)
      {
        throw new ConfigurationErrorsException("Missing ServerConnectionConfig");
      }

      var connection =
        new ServerConnection(cfgValues.ServerAddress, cfgValues.ServerPort, cfgValues.ServerEndPoint);

      builder.Services.AddSingleton(connection);

      logger.Info($"Using ServerConnection: {connection.ServerAddress}");

      builder.Services.AddTransient<MainPage>();

      logger.Info("Registering ViewModels");

      builder.Services.AddTransient<MainViewModel>();
      builder.Services.AddTransient<ServerViewModel>();
    }
    catch (Exception exc)
    {
      logger.Log(LogLevel.Error, exc);
      success = false;
    }

    return success;
  }
}
