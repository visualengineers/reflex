using System.Collections.Generic;

namespace ReFlex.Core.Common.Components
{
    public class InteractionHistory
    {
        public int TouchId { get; }
        
        public  List<InteractionHistoryElement> Items { get; }

        public InteractionHistory( int touchId, List<InteractionHistoryElement> items)
        {
            Items = items;
            TouchId = touchId;
        }
    }
}