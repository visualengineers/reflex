using Microsoft.AspNetCore.SignalR;
using TrackingServer.Model;

namespace TrackingServer.Hubs
{
    public class PerformanceHub : Hub
    {
        public static readonly string PerformanceGroup = "PerformanceData";
        private readonly PerformanceService _performanceService;


        public PerformanceHub(PerformanceService performanceService)
        {
            _performanceService = performanceService;
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
            await StartCollectingData();

        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
            await StopCollectingData();
        }

        public async Task StartCollectingData()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, PerformanceGroup);
            _performanceService.SubscribePerformanceData(Context.ConnectionId);
        }

        public async Task StopCollectingData()
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, PerformanceGroup);
            _performanceService.UnsubscribePerformanceData(Context.ConnectionId);
        }
    }
}
