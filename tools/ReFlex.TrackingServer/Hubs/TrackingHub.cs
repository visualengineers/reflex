using TrackingServer.Data.Tracking;
using TrackingServer.Model;

namespace TrackingServer.Hubs
{
    public class TrackingHub : StateHubBase<TrackingConfigState>
    {
        private readonly TrackingService _trackingService;

        public static readonly string TrackingStateGroup = "TrackingState";
        public static readonly string RecordingGroup = "RecordingState";

        public TrackingHub(TrackingService trackingService) 
            : base(trackingService, TrackingStateGroup)
        {
            _trackingService = trackingService;
        }

        public async Task StartRecordingState()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, RecordingGroup);
            _trackingService.RecordingStateManager.Subscribe(Context.ConnectionId);
        }

        public async Task StopRecordingState()
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, RecordingGroup);
            _trackingService.RecordingStateManager.Unsubscribe(Context.ConnectionId);
        }
    }
}