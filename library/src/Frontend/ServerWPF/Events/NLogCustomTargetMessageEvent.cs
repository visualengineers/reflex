using NLog;
using Prism.Events;

namespace ReFlex.Frontend.ServerWPF.Events
{
    public class NLogCustomTargetMessageEvent : PubSubEvent<LogEventInfo>
    {
    }
}
