using ExampleMAUI.ViewModels;
using ReFlex.Core.Common.Util;

namespace ExampleMAUI.Util;

public class InteractionsDrawable : IDrawable
{

  public List<InteractionViewModel> Interactions { get; set; } = new();

  private Color TextColor { get; set; } = (Color)(Application.Current?.Resources["GrayLight"] ?? Colors.Black);
  private Color InteractionsColorDefault { get; set; } = (Color) (Application.Current?.Resources["Primary"] ?? Colors.Blue);
  private Color InteractionsColorMin { get; set; } = (Color)(Application.Current?.Resources["Error"] ?? Colors.Red);
  private Color InteractionsColorMax { get; set; } = (Color)(Application.Current?.Resources["Success"] ?? Colors.Green);

  public void Draw(ICanvas canvas, RectF dirtyRect)
  {
    foreach (var vm in Interactions)
    {
      var size = (float) (75.0 * vm.Scale);
      var posOffset = size * 0.5f;



      var centerX = (float)(vm.AssociatedInteraction.Position.X * dirtyRect.Width);
      var centerY = (float)(vm.AssociatedInteraction.Position.Y * dirtyRect.Height);

      canvas.StrokeSize = 4;
      canvas.StrokeColor = vm.Type == ExtremumType.Minimum ? InteractionsColorMin : vm.Type == ExtremumType.Maximum ? InteractionsColorMax : InteractionsColorDefault;
      canvas.DrawEllipse(centerX - posOffset, centerY - posOffset, size, size);

      canvas.FontColor = TextColor;
      canvas.FontSize = 24;
      canvas.DrawString($"{vm.AssociatedInteraction.TouchId}", centerX - 25, centerY - 25, 50, 50, HorizontalAlignment.Center, VerticalAlignment.Center);
    }
  }
}
