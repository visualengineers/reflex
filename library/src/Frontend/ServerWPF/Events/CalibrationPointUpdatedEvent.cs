using System;
using System.Windows;
using Prism.Events;

namespace ReFlex.Frontend.ServerWPF.Events
{
    public class CalibrationPointUpdatedEvent : PubSubEvent<Tuple<int, Point>>
    {

    }
}