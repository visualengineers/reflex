using NLog;
using ReFlex.Server.Data.Log;
using TrackingServer.Util;

namespace TrackingServer.Model
{
    public class LogDataProviderService
    {
        private readonly IEventAggregator _evtAggregator;

        private readonly IList<LogMessageDetail> _logMessages = new List<LogMessageDetail>();

        public LogDataProviderService(IEventAggregator evtAggregator)
        {
            _evtAggregator = evtAggregator;
            _evtAggregator.GetEvent<NLogCustomTargetMessageEvent>().Subscribe(OnLogUpdated);
        }

        private void OnLogUpdated(LogEventInfo message)
        {
            var element = new LogMessageDetail(message.SequenceID, message.FormattedMessage, message.Level);
            _logMessages.Add(element);
        }

        public IList<LogMessageDetail> GetMessages(int startIdx = 0)
        {
            return _logMessages.Where(msg => msg.Id > startIdx).ToList();
        }
    }
}
