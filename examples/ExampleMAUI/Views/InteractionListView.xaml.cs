using ExampleMAUI.ViewModels;

namespace ExampleMAUI.Views;

public partial class InteractionListView : ContentView
{
  public InteractionListView()
  {
    BindingContext = App.Services?.GetService<InteractionListViewModel>();

    InitializeComponent();
  }
}

