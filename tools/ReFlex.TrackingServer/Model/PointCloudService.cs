using System.Collections.Concurrent;
using System.Reactive.Linq;
using Implementation.Interfaces;
using Microsoft.AspNetCore.SignalR;
using NLog;
using ReFlex.Core.Common.Components;
using TrackingServer.Hubs;

namespace TrackingServer.Model {

    public class PointCloudService {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
        private readonly IDepthImageManager _depthImageManager;
        private readonly IHubContext<PointCloudHub> _hubContext;
        private readonly IObservable<Point3[]> _pointCloudObservable;
        private readonly ConcurrentDictionary<string, IDisposable> _pointCloudSubscriptions;
        private static double TOLERANCE = 0.0001;

        public PointCloudService(IDepthImageManager depthImageManager, IHubContext<PointCloudHub> hubContext)
        {
            _depthImageManager = depthImageManager;
            _hubContext = hubContext;

            var pointCloudObservable = Observable.FromEventPattern<PointCloud3>(
                (handler) => _depthImageManager.PointcloudFiltered += handler, 
                (handler) => _depthImageManager.PointcloudFiltered -= handler);
  
            var shrunkSize = 40000;
            var shrunk = new Point3[shrunkSize];
            _pointCloudObservable = pointCloudObservable
                .Sample(TimeSpan.FromMilliseconds(100)) 
                .Select(evt => evt.EventArgs.AsArray())
                .Select(points => points.Where(p => !(System.Math.Abs(p.X) < TOLERANCE && System.Math.Abs(p.Y) < TOLERANCE )).ToArray()) // && Math.Abs(p.Z) < TOLERANCE
                 .Select(array => 
                 {
                     if (array.Length <= shrunkSize) {
                         return array;
                     }
                     var step = array.Length / shrunkSize;
                     for(int i = 0; i < shrunkSize; ++i) 
                     {
                         shrunk[i] = array[i * step];
                     }
                     return shrunk;
                 })
                .Do(points => _hubContext.Clients.Groups(PointCloudHub.PointCloudGroup).SendAsync("pointCloud", points).Wait())
                .Publish()
                .RefCount();

            _pointCloudSubscriptions = new ConcurrentDictionary<string, IDisposable>();
        }

        public void SubscribePointCloud(string id)
        {
            _pointCloudSubscriptions.AddOrUpdate(
                id, 
                (addId) => _pointCloudObservable.Subscribe(),
                (updateId, sub) => {
                    sub.Dispose();
                    return _pointCloudObservable.Subscribe();
                });
        }

        public void UnsubscribePointCloud(string id) 
        {
            if (_pointCloudSubscriptions.TryRemove(id, out var sub))
            {
                sub.Dispose();
            }
        }

    }
}