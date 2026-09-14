using TrackingServer.Model;

namespace TrackingServer.Hubs
{
    public class CalibrationHub : StateHubBase<string>
    {
        private readonly CalibrationService _calibrationService;

        public const string CalibrationStateGroup = "CalibrationState";
        public const string CalibrationsGroup = "Calibration";

        public CalibrationHub(CalibrationService calibrationService) 
            : base(calibrationService, CalibrationStateGroup)
        {
            _calibrationService = calibrationService;
        }

        public async Task StartCalibrationSubscription()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, CalibrationsGroup);
            _calibrationService.CalibrationSubscriptionManager.Subscribe(Context.ConnectionId);
        }
        
        public async Task StopCalibrationSubscription()
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, CalibrationsGroup);
            _calibrationService.CalibrationSubscriptionManager.Unsubscribe(Context.ConnectionId);
        }
    }
}