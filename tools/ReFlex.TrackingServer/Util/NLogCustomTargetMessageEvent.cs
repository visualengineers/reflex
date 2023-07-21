using NLog;
using Prism.Events;

namespace TrackingServer.Util
{
    public class NLogCustomTargetMessageEvent : PubSubEvent<LogEventInfo>
    {
    }
}
