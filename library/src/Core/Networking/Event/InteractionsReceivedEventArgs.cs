using System;
using System.Collections.Generic;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Networking.Event
{
    public class InteractionsReceivedEventArgs : EventArgs
    {
        public List<Interaction> Interactions { get; }

        public InteractionsReceivedEventArgs(object sender, string message)
        {
            Interactions = SerializationUtils.DeserializeFromJson<List<Interaction>>(message) ?? new List<Interaction>();
        }
    }
}