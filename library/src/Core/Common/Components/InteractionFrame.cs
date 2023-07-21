using System.Collections.Generic;

namespace ReFlex.Core.Common.Components
{
    public class InteractionFrame
    {
        public int FrameId { get; private set; }

        public List<Interaction> Interactions { get; } = new List<Interaction>();

        public InteractionFrame(int id)
        {
            FrameId = id;
        }

        public InteractionFrame(int id, List<Interaction> interactions) : this(id)
        {
            Interactions = interactions;
        }
    }
}