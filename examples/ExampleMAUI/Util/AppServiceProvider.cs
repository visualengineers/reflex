namespace ExampleMAUI.Util;

public static class AppServiceProvider
{
  public static TService GetService<TService>()
    => Current.GetService<TService>() ?? throw new InvalidOperationException($"Service of type {typeof(TService)} could not be found.");

  public static IServiceProvider Current
    =>
#if WINDOWS10_0_17763_0_OR_GREATER
            MauiWinUIApplication.Current.Services;
#elif ANDROID
            MauiApplication.Current.Services;
#elif IOS || MACCATALYST
      MauiUIApplicationDelegate.Current.Services;
#else
            null;
#endif
}
