using ExampleMAUI.ViewModels;

namespace ExampleMAUI.Util;

public class InteractionGraphicsView: GraphicsView
{
  public List<InteractionViewModel> InteractionList
  {
    get => (List<InteractionViewModel>)GetValue(InteractionListProperty);
    set => SetValue(InteractionListProperty, value);
  }

  public static readonly BindableProperty InteractionListProperty =
    BindableProperty.Create(
      nameof(InteractionList),
      typeof(List<InteractionViewModel>),
      typeof(InteractionGraphicsView),
      propertyChanged: InteractionListPropertyChanged);

  private static void InteractionListPropertyChanged(BindableObject bindable, object oldValue, object newValue)
  {
    if (bindable is not InteractionGraphicsView { Drawable: InteractionsDrawable drawable }  view)
      return;

    drawable.Interactions = (List<InteractionViewModel>)newValue;
    view.Invalidate();
  }
}
