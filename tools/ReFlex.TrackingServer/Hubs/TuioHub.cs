using TrackingServer.Model;

namespace TrackingServer.Hubs
{
    public class TuioHub : StateHubBase<string>
    {
        private readonly TuioService _tuioService;
        
        public static readonly string TuioStateGroup = "TuioState";
        public static readonly string PackageDetailsGroup = "TuioPackageDetails";

        public TuioHub(TuioService tuioService) 
            : base(tuioService, TuioStateGroup)
        {
            _tuioService = tuioService;
        }

        public async Task StartPackageDetails()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, PackageDetailsGroup);
            _tuioService.PackageDetailsSubscriptionManager.Subscribe(Context.ConnectionId);
        }
        
        public async Task StopPackageDetails()
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, PackageDetailsGroup);
            _tuioService.PackageDetailsSubscriptionManager.Unsubscribe(Context.ConnectionId);
        }
    }
}