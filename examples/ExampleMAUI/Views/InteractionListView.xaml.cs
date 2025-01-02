using ExampleMAUI.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ExampleMAUI.Views;

public partial class InteractionListView : ContentView
{
  public InteractionListView()
  {
    BindingContext = App.Services.GetService<InteractionListViewModel>();

    InitializeComponent();
  }
}

