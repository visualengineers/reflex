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

      builder
        // .UsePrism(prism =>
        // {
        //   prism.RegisterTypes(container =>
        //   {
        //     // PlatformInitializer.RegisterTypes(container, Logger);
        //   });
        //   prism.CreateWindow(
        //     async (container, navigation) =>
        //     {
        //       var result = await navigation.NavigateAsync(new Uri("/MainBluppPage"));
        //       if (!result.Success)
        //       {
        //         Logger.Error(result.Exception, "Unhandled exception when creating Window");
        //       }
        //     });
        // })
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
      Console.WriteLine(e);
    }

    return builder.Build();
  }
}
