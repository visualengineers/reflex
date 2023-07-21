using System.Windows;
using System.Windows.Controls;
using NLog;

namespace ReFlex.Frontend.ServerWPF.Template
{
    public class LogMessageDisplayTemplateSelector : DataTemplateSelector
    {
        public DataTemplate DefaultLogDataTemplate { get; set; }

        public DataTemplate DebugLogDataTemplate { get; set; }

        public DataTemplate InfoLogDataTemplate { get; set; }

        public DataTemplate ErrorLogDataTemplate { get; set; }

        public DataTemplate FatalLogDataTemplate { get; set; }

        public DataTemplate TraceLogDataTemplate { get; set; }

        public DataTemplate WarnLogDataTemplate { get; set; }

        public override DataTemplate SelectTemplate(object item, DependencyObject container)
        {
            if (!(item is LogEventInfo msg))
                return base.SelectTemplate(item, container);

            if (msg.Level == LogLevel.Debug)
                return DebugLogDataTemplate;

            if (msg.Level == LogLevel.Info)
                return InfoLogDataTemplate;

            if (msg.Level == LogLevel.Error)
                return ErrorLogDataTemplate;

            if (msg.Level == LogLevel.Fatal)
                return FatalLogDataTemplate;

            if (msg.Level == LogLevel.Trace)
                return TraceLogDataTemplate;

            if (msg.Level == LogLevel.Warn)
                return WarnLogDataTemplate;

            return DefaultLogDataTemplate;
        }
    }
}
