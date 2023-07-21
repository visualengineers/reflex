namespace TrackingServer.Data.Tracking
{
    public class TrackingConfigState
    {
        public bool IsCameraSelected { get; set; }

        public string SelectedCameraName { get; set; }

        public string SelectedConfigurationName { get; set; }

        public string DepthCameraStateName { get; set; }
    }
}
