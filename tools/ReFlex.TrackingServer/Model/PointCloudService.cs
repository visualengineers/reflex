using System.Collections.Concurrent;
using System.Reactive.Linq;
using Implementation.Interfaces;
using Microsoft.AspNetCore.SignalR;
using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Server.Data;
using TrackingServer.Events;
using TrackingServer.Hubs;

namespace TrackingServer.Model {

    public class PointCloudService {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
        private readonly IEventAggregator _eventAggregator;
        private readonly IDepthImageManager _depthImageManager;
        private readonly ConfigurationManager _configurationManager;
        private readonly IHubContext<PointCloudHub> _hubContext;
        private IObservable<Point3[]> _pointCloudObservable;
        private readonly ConcurrentDictionary<string, IDisposable> _pointCloudSubscriptions;
        private static double TOLERANCE = 0.0001;

        public PointCloudService(IDepthImageManager depthImageManager, ConfigurationManager configurationManager, IEventAggregator eventAggregator, IHubContext<PointCloudHub> hubContext)
        {
            _depthImageManager = depthImageManager;
            _hubContext = hubContext;
            _configurationManager = configurationManager;
            _eventAggregator = eventAggregator;

            _eventAggregator.GetEvent<ServerSettingsUpdatedEvent>().Subscribe(OnSettingsUpdated);

            SetupPointCloudObservable();

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

        private void SetupPointCloudObservable()
        {
          var scaleDown = !_configurationManager.Settings.PointCloudSettingValues?.FullResolution ?? false;

          var shrunkSize = scaleDown
            ? (_configurationManager.Settings?.CameraConfigurationValues?.Width ?? 0) * (_configurationManager.Settings?.CameraConfigurationValues?.Height ?? 0)
            : _configurationManager.Settings?.PointCloudSettingValues?.PointCloudSize ?? 40000;

          var interval = _configurationManager.Settings?.PointCloudSettingValues?.UpdateInterval ?? 100;

          var pointCloudObservable = Observable.FromEventPattern<PointCloud3>(
            (handler) => _depthImageManager.PointcloudFiltered += handler,
            (handler) => _depthImageManager.PointcloudFiltered -= handler);

          var shrunk = new Point3[shrunkSize];
          _pointCloudObservable = pointCloudObservable
            .Sample(TimeSpan.FromMilliseconds(interval))
            .Select(evt => evt.EventArgs.AsArray())
            // .Select(points => points.Where(p => !(System.Math.Abs(p.X) < TOLERANCE && System.Math.Abs(p.Y) < TOLERANCE )).ToArray()) // && Math.Abs(p.Z) < TOLERANCE
            .Select(array =>
            {
              if (!scaleDown || shrunkSize <= 0 || array.Length <= shrunkSize) {
                return array;
              }
              var step = array.Length / shrunkSize;

              if (step >= 1)
              {
                return array;
              }

              for(int i = 0; i < shrunkSize; ++i)
              {
                shrunk[i] = array[i * step];
              }
              return shrunk;
            })
            .Do(points => _hubContext.Clients.Groups(PointCloudHub.PointCloudGroup).SendAsync("pointCloud", points).Wait())
            .Publish()
            .RefCount();
        }

        private void OnSettingsUpdated(TrackingServerAppSettings obj)
        {
          SetupPointCloudObservable();
        }

    }
}
