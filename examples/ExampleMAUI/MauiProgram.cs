using ExampleMAUI.Util;
using NLog;

namespace ExampleMAUI;

public static class MauiProgram
{

  private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

  public static MauiApp CreateMauiApp()
  {
    var builder = MauiApp.CreateBuilder();

    try
    {
      builder
        .UseMauiApp<App>();

      // wait for loading app settings and other async initialization stuff
      Task.Run(() => PlatformInitializer.RegisterTypes(builder, Logger)).GetAwaiter().GetResult();

      builder
        .ConfigureFonts(fonts =>
        {
          fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
          fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
        });

  #if DEBUG
		  builder.Logging.AddDebug();
  #endif
    }
    catch (Exception e)
    {
      Logger.Error(e);
    }

    return builder.Build();
  }
}
