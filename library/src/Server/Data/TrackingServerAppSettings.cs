using ReFlex.Core.Tuio.Util;
using ReFlex.Server.Data.Config;

namespace ReFlex.Server.Data
{
    public class TrackingServerAppSettings
    {
        public FilterSettings FilterSettingValues { get; set; } = new();

        public ReFlex.Core.Calibration.Util.Calibration CalibrationValues { get; set; }

        public FrameSizeDefinition FrameSize { get; set; } = new();

        public bool IsAutoStartEnabled { get; set; }

        public string? DefaultCamera { get; set; }

        public CameraConfiguration CameraConfigurationValues { get; set; } = new();

        public NetworkSettings NetworkSettingValues { get; set; } = new();

        public PointCloudSettings PointCloudSettingValues { get; set; } = new();

        public ProcessingSettings ProcessingSettingValues { get; set; } = new();

        public RemoteProcessingServiceSettings RemoteProcessingServiceSettingsValues { get; set; } = new();

        public TuioConfiguration TuioSettingValues { get; set; } = new();

        public string GetCompleteValues()
        {
            var result = $"{DefaultCamera} | ";
            result += $"{CameraConfigurationValues.GetCameraDefinitionString()}";
            result += $"{nameof(IsAutoStartEnabled)}: {IsAutoStartEnabled}{Environment.NewLine}";
            result += FrameSize.GetFrameSizeDefinitionString();
            result += FilterSettingValues.GetFilterSettingsString();
            result += CalibrationValues.GetCalibrationValuesString();
            result += NetworkSettingValues.GetNetworksSettingsString();
            result += PointCloudSettingValues.GetPointCloudSettingsString();
            result += ProcessingSettingValues.GetPorcessingSettingsString();
            result += RemoteProcessingServiceSettingsValues.GetRemoteProcessingServiceSettingsString();
            result += TuioSettingValues.GetTuioConfigurationString();

            return result;
        }
    }
}
