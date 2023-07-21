using System;
using CommonServiceLocator;
using NLog;
using NLog.Targets;
using Prism.Events;
using Prism.Ioc;
using Prism.Unity;
using ReFlex.Frontend.ServerWPF.Events;
using Unity;

namespace ReFlex.Frontend.ServerWPF.Util.NLog
{
    [Target("InAppConsoleLogger")]
    public sealed class InAppLogTarget : TargetWithLayout
    {
        private IEventAggregator _evtAggregator;


        public InAppLogTarget()
        {
//#if !DEBUG

            Layout = @"${date:format=HH\:mm\:ss} ${level} ${message} ${exception}";
            Name = "InAppConsoleLogger";
//#endif

        }

        protected override void Write(LogEventInfo logEvent)
        {
            if (_evtAggregator == null)
            {
                try
                {
                    _evtAggregator = ContainerLocator.Container.Resolve<IEventAggregator>();
                }
                catch (NullReferenceException exc)
                {
                    return;
                }
            }
                

            //#if !DEBUG
            var msg = Layout.Render(logEvent);
            _evtAggregator.GetEvent<NLogCustomTargetMessageEvent>().Publish(logEvent);
// #endif
        }
    }
}
