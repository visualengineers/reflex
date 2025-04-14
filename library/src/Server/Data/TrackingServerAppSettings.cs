using ReFlex.Core.Tuio.Util;
using ReFlex.Server.Data.Config;

namespace ReFlex.Server.Data
{
    public class TrackingServerAppSettings
    {
        public FilterSettings FilterSettingValues { get; set; }

        public ReFlex.Core.Calibration.Util.Calibration CalibrationValues { get; set; }

        public FrameSizeDefinition FrameSize { get; set; }

        public bool IsAutoStartEnabled { get; set; }

        public string DefaultCamera { get; set; }

        public CameraConfiguration CameraConfigurationValues { get; set; }

        public NetworkSettings NetworkSettingValues { get; set; }

        public ProcessingSettings ProcessingSettingValues { get; set; }

        public RemoteProcessingServiceSettings RemoteProcessingServiceSettingsValues { get; set; }

        public TuioConfiguration TuioSettingValues { get; set; }

        public string GetCompleteValues()
        {
            var result = $"{DefaultCamera} | ";
            result += $"{CameraConfigurationValues.GetCameraDefinitionString()}";
            result += $"{nameof(IsAutoStartEnabled)}: {IsAutoStartEnabled}{Environment.NewLine}";
            result += FrameSize?.GetFrameSizeDefinitionString() ?? $"{nameof(FrameSize)} not set.";
            result += FilterSettingValues?.GetFilterSettingsString() ?? $"{nameof(FilterSettingValues)} not set.";
            result += CalibrationValues.GetCalibrationValuesString();
            result += NetworkSettingValues?.GetNetworksSettingsString() ?? $"{nameof(NetworkSettingValues)} not set.";
            result += ProcessingSettingValues?.GetPorcessingSettingsString()  ?? $"{nameof(ProcessingSettingValues)} not set.";
            result += RemoteProcessingServiceSettingsValues?.GetRemoteProcessingServiceSettingsString()  ?? $"{nameof(RemoteProcessingServiceSettingsValues)} not set.";
            result += TuioSettingValues?.GetTuioConfigurationString()  ?? $"{nameof(TuioSettingValues)} not set.";

            return result;
        }
    }
}
