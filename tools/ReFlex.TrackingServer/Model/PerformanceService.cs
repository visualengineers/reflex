using System.Collections.Concurrent;
using System.Reactive.Linq;
using Microsoft.AspNetCore.SignalR;
using NLog;
using ReFlex.Core.Common.Interfaces;
using ReFlex.Core.Common.Util;
using TrackingServer.Data.Performance;
using TrackingServer.Hubs;

namespace TrackingServer.Model
{
    public class PerformanceService
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
        private readonly IPerformanceAggregator _performanceAggregator;
        private readonly IHubContext<PerformanceHub> _hubContext;
        private readonly IObservable<PerformanceDataConverted> _performanceObservable;
        private readonly ConcurrentDictionary<string, IDisposable> _performanceSubscriptions;
        
        public PerformanceService(IPerformanceAggregator performanceAggregator, IHubContext<PerformanceHub> hubContext)
        {
            _performanceAggregator = performanceAggregator;
            _hubContext = hubContext;

            var performanceObservable = Observable.FromEventPattern<PerformanceData>(
                (handler) => _performanceAggregator.PerformanceDataUpdated += handler, 
                (handler) => _performanceAggregator.PerformanceDataUpdated -= handler);
  
            _performanceObservable = performanceObservable
                .Select(evt => ConvertData(evt.EventArgs))
                .Do(performanceData => _hubContext.Clients.Groups(PerformanceHub.PerformanceGroup).SendAsync("performanceData", performanceData).Wait())
                .Publish()
                .RefCount();

            _performanceSubscriptions = new ConcurrentDictionary<string, IDisposable>();
        }

        private static PerformanceDataConverted ConvertData(PerformanceData data)
        {
            var result = new PerformanceDataConverted
            {
                Data = data.Data.Select(item => new PerformanceDataItemConverted
                {
                    FrameId = item.FrameId,
                    LimitationFilter = item.Filter.LimitationFilter.TotalMilliseconds,
                    ValueFilter = item.Filter.ValueFilter.TotalMilliseconds,
                    ThresholdFilter = item.Filter.ThresholdFilter.TotalMilliseconds,
                    BoxFilter = item.Filter.BoxFilter.TotalMilliseconds,
                    UpdatePointCloud = item.Filter.UpdatePointCloud.TotalMilliseconds,
                    ProcessingPreparation = item.Process.Preparation.TotalMilliseconds,
                    ProcessingUpdate = item.Process.Update.TotalMilliseconds,
                    ProcessingConvert = item.Process.ConvertDepthValue.TotalMilliseconds,
                    ProcessingSmoothing = item.Process.Smoothing.TotalMilliseconds,
                    ProcessingExtremum = item.Process.ComputeExtremumType.TotalMilliseconds
                    
                }).ToArray()
            };
            return result;
        }

        public void SubscribePerformanceData(string id)
        {
            _performanceSubscriptions.AddOrUpdate(
                id, 
                (addId) => _performanceObservable.Subscribe(),
                (updateId, sub) => {
                    sub.Dispose();
                    return _performanceObservable.Subscribe();
                });
        }

        public void UnsubscribePerformanceData(string id) 
        {
            if (_performanceSubscriptions.TryRemove(id, out var sub))
            {
                sub.Dispose();
            }
        }

    }
}