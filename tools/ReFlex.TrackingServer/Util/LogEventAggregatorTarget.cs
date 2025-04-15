using NLog;
using NLog.Targets;

namespace TrackingServer.Util
{
    [Target("LogEventAggregator")]
    public sealed class LogEventAggregatorTarget : TargetWithLayout
    {
        private readonly IEventAggregator? _evtAggregator;

        public LogEventAggregatorTarget()
        {
            Layout = @"${date:format=HH\:mm\:ss} ${level} ${message} ${exception}";
            Name = "LogEventAggregator";
        }

        public LogEventAggregatorTarget(IEventAggregator? evtAggregator) : this()
        {
            _evtAggregator = evtAggregator;
        }


        protected override void Write(LogEventInfo logEvent)
        {
            if (_evtAggregator == null)
                return;

            //#if !DEBUG
            var msg = Layout.Render(logEvent);
            _evtAggregator.GetEvent<NLogCustomTargetMessageEvent>().Publish(logEvent);
            // #endif
        }
    }
}
