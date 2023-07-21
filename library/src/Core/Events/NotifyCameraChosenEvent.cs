using System;
using Prism.Events;

namespace ReFlex.Core.Events
{
    public class NotifyCameraChosenEvent : PubSubEvent<Tuple<int, int>>
    {
    }
}
