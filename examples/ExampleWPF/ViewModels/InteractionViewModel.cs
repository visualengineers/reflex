using Prism.Mvvm;
using ReFlex.Core.Common.Components;

namespace ExampleWPF.ViewModels;

public class InteractionViewModel : BindableBase
{
    public Interaction AssociatedInteraction { get; private set; }

    public InteractionViewModel(Interaction associatedInteraction)
    {
        AssociatedInteraction = associatedInteraction;
    }
}