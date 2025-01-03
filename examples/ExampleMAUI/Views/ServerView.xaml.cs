using ExampleMAUI.ViewModels;

namespace ExampleMAUI.Views;

public partial class ServerView : ContentView
{
  public ServerView()
  {
    BindingContext = App.Services.GetService<ServerViewModel>();
    InitializeComponent();
  }
}

