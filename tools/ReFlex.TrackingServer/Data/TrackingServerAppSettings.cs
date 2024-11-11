using System;
using System.Diagnostics.CodeAnalysis;
using ReFlex.Core.Tuio.Util;
using TrackingServer.Data.Config;

namespace TrackingServer.Data
{
    public class TrackingServerAppSettings
    {
        public FilterSettings FilterSettingValues { get; set; } = new();

        public ReFlex.Core.Calibration.Util.Calibration CalibrationValues { get; set; }

        public FrameSizeDefinition FrameSize { get; set; } = new();

        public bool IsAutoStartEnabled { get; set; }

        public string DefaultCamera { get; set; } = "";

        public CameraConfiguration CameraConfigurationValues { get; set; } = new();

        public NetworkSettings NetworkSettingValues { get; set; } = new();

        public PredictionSettings PredictionSettings { get; set; } = new();

        public ProcessingSettings ProcessingSettingValues { get; set; } = new();

        public RemoteProcessingServiceSettings RemoteProcessingServiceSettingsValues { get; set; } = new();

        public TuioConfiguration TuioSettingValues { get; set; } = new();

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