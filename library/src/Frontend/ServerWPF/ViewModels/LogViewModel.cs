using System;
using System.Collections.ObjectModel;
using System.Windows;
using NLog;
using Prism.Events;
using Prism.Mvvm;
using ReFlex.Frontend.ServerWPF.Events;

namespace ReFlex.Frontend.ServerWPF.ViewModels
{
    public class LogViewModel : BindableBase, IDisposable
    {
        private readonly IEventAggregator _evtAggregator;

        public ObservableCollection<LogEventInfo> LogMessages { get; } = new ObservableCollection<LogEventInfo>();

        public LogViewModel(IEventAggregator evtAggregator)
            {
                _evtAggregator = evtAggregator;
                _evtAggregator.GetEvent<NLogCustomTargetMessageEvent>().Subscribe(OnNLogMessage);
                _evtAggregator.GetEvent<ExitApplicationEvent>().Subscribe(OnAppExit);
            }

        private void OnAppExit()
        {
            _evtAggregator.GetEvent<NLogCustomTargetMessageEvent>().Unsubscribe(OnNLogMessage);
            _evtAggregator.GetEvent<ExitApplicationEvent>().Unsubscribe(OnAppExit);
        }

        private void OnNLogMessage(LogEventInfo msg)
        {
            Application.Current?.Dispatcher?.Invoke(
                () =>
                {
                    if (LogMessages.Count > 1000)
                        LogMessages.Clear();
                    LogMessages.Add(msg);
                });
        }

        public void Dispose()
        {
            OnAppExit();
        }
    }
}
