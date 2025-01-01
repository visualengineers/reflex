using ExampleMAUI.Util;

namespace ExampleMAUI;

public static class MauiProgram
{
  public static MauiApp CreateMauiApp()
  {
    var builder = MauiApp.CreateBuilder();
    builder
      .UseMauiApp<App>()
      .UsePrism(prism =>
      {
        prism.RegisterTypes(PlatformInitializer.RegisterTypes);
        prism.CreateWindow("/MainPage", exception => Console.WriteLine(exception));
      })
      .ConfigureFonts(fonts =>
      {
        fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
        fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
      });

#if DEBUG
		builder.Logging.AddDebug();
#endif

    return builder.Build();
  }
}
