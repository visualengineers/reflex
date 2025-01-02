using ExampleMAUI.ViewModels;

namespace ExampleMAUI.Util;

public class InteractionsDrawable : IDrawable
{

  public List<InteractionViewModel> Interactions { get; set; } = new();

  public void Draw(ICanvas canvas, RectF dirtyRect)
  {
    foreach (var vm in Interactions)
    {
      var size = (float) (75.0 * vm.Scale);
      var posOffset = size * 0.5f;

      canvas.StrokeSize = 4;
      canvas.StrokeColor = Colors.Blue;
      canvas.DrawEllipse((float) ((vm.AssociatedInteraction.Position.X * dirtyRect.Width) - posOffset), (float) ((vm.AssociatedInteraction.Position.Y * dirtyRect.Height) - posOffset), size, size);
    }
  }
}
