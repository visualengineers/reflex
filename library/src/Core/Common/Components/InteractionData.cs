using System.Collections.Generic;

namespace ReFlex.Core.Common.Components;

public class InteractionData(IList<Interaction> interactions, IList<InteractionVelocity> velocities)
{
    public IList<Interaction> Interactions { get; } = interactions;

    public IList<InteractionVelocity> Velocities { get; } = velocities;
}