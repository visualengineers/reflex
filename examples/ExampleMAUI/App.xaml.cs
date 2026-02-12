using ExampleMAUI.Util;

namespace ExampleMAUI;

public partial class App : Application
{
  public static IServiceProvider? Services => AppServiceProvider.Current;

  /// <summary>
  /// Initialization of the app.
  ///
  /// <remarks>We cannot directly inject the MainPage, as the Application needs to be initialized BEFORE the Page, so that the Resources are correctly initialized (otherwise StaticResources throw an exception)</remarks>
  /// </summary>
  /// <param name="services">services provided by <see cref="MauiAppBuilder"/></param>
  public App(IServiceProvider services)
  {
    InitializeComponent();

    MainPage = services.GetService<MainPage>();
  }
}
