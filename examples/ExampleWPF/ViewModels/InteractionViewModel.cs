using Prism.Mvvm;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;

namespace ExampleWPF.ViewModels;

public class InteractionViewModel : BindableBase
{
    public Interaction AssociatedInteraction { get; private set; }
    public double OffsetX { get; private set; }
    public double OffsetY { get; private set; }
    public double Scale { get; private set; }
    
    public ExtremumType Type { get; private set; }

    public InteractionViewModel(Interaction associatedInteraction, double canvasWidth, double canvasHeight)
    {
        AssociatedInteraction = associatedInteraction;
        
        OffsetX = associatedInteraction.Position.X * canvasWidth;
        OffsetY = associatedInteraction.Position.Y * canvasHeight;
        Scale = 0.5 + System.Math.Abs(associatedInteraction.Position.Z);

        Type = associatedInteraction.ExtremumDescription.Type;
    }
}