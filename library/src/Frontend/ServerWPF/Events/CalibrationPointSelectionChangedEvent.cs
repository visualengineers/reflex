using System;
using Prism.Events;

namespace ReFlex.Frontend.ServerWPF.Events
{
    public class CalibrationPointSelectionChangedEvent : PubSubEvent<Tuple<int, bool>>
    {
        
    }
}