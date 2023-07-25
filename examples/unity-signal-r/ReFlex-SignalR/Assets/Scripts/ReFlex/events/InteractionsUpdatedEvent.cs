using System;
using System.Collections.Generic;
using ReFlex.Core.Common.Components;
using UnityEngine.Events;

namespace ReFlex.events
{
    [Serializable]
    public class InteractionsUpdatedEvent : UnityEvent<List<Interaction>>
    {
        
    }
}