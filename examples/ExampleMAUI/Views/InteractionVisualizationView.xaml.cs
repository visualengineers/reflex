using ExampleMAUI.ViewModels;

namespace ExampleMAUI.Views;

public partial class InteractionVisualizationView : ContentView
{
  public InteractionVisualizationView()
  {
    BindingContext = App.Services?.GetService<InteractionVisualizationViewModel>();

    InitializeComponent();
  }
}

