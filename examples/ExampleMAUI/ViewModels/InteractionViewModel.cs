using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;

namespace ExampleMAUI.ViewModels;

public class InteractionViewModel : BindableBase
{
    public Interaction AssociatedInteraction { get; private set; }
    public double Scale { get; private set; }

    public ExtremumType Type { get; private set; }

    public InteractionViewModel(Interaction associatedInteraction)
    {
        AssociatedInteraction = associatedInteraction;

        Scale = 0.5 + System.Math.Abs(associatedInteraction.Position.Z);

        Type = associatedInteraction.ExtremumDescription.Type;
    }
}
