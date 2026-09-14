using LogLevel = NLog.LogLevel;

namespace ReFlex.Server.Data.Log
{
    public class LogMessageDetail
    {
        public int Id { get; }

        public string FormattedMessage { get; }

        public int Level { get; }

        public LogMessageDetail(in int id, string message, LogLevel level)
        {
            Id = id;
            FormattedMessage = message;
            Level = level.Ordinal;
        }
    }
}
