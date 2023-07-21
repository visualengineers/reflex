using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using TrackingServer.Model;

namespace TrackingServer.Hubs {
    public class PointCloudHub : Hub
    {
        public static readonly string PointCloudGroup = "PointCloud";
        private readonly PointCloudService _pointCloudService;

        public PointCloudHub(PointCloudService pointCloudService)
        {
            _pointCloudService = pointCloudService;
        }

        public override async Task OnConnectedAsync() 
        {
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            await base.OnDisconnectedAsync(exception);
            await StopPointCloud();
        }

        public async Task StartPointCloud() 
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, PointCloudGroup);
            _pointCloudService.SubscribePointCloud(Context.ConnectionId);
        }

        public async Task StopPointCloud() 
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, PointCloudGroup);
            _pointCloudService.UnsubscribePointCloud(Context.ConnectionId);
        }
    }
}