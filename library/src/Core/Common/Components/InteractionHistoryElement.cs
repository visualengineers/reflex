using System.Collections.Generic;

namespace ReFlex.Core.Common.Components
{
    public class InteractionHistoryElement
    {
        public int FrameId { get; }
        
        public Interaction Interaction { get; }

        public InteractionHistoryElement(int frameId, Interaction interaction)
        {
            FrameId = frameId;
            Interaction = interaction;
        }
    }
}