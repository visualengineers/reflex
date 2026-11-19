using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Tuio.Util;
using ReFlex.Server.Data.Config;

namespace ReFlex.Server.Data
{
    public class TrackingServerAppSettings
    {
        /// <summary>XY Kalman filtering is opt-in; omitted legacy values preserve existing behavior.</summary>
        public bool UseKalmanFilter { get; set; }

        /// <summary>Probabilistic identity recovery after overlap is opt-in.</summary>
        public bool UseJpda { get; set; }

        public bool UseMinimumCostAssignment { get; set; } = true;

        private float _assignmentMissCost = InteractionSmoothingBehaviour.DefaultAssignmentMissCost;
        private float _assignmentBirthCost = InteractionSmoothingBehaviour.DefaultAssignmentBirthCost;

        public float AssignmentMissCost
        {
            get => _assignmentMissCost;
            set => _assignmentMissCost = float.IsFinite(value) && value >= 0
                ? value : throw new ArgumentOutOfRangeException(nameof(value));
        }

        public float AssignmentBirthCost
        {
            get => _assignmentBirthCost;
            set => _assignmentBirthCost = float.IsFinite(value) && value >= 0
                ? value : throw new ArgumentOutOfRangeException(nameof(value));
        }

        public FilterSettings FilterSettingValues { get; set; } = new();

        public ReFlex.Core.Calibration.Util.Calibration CalibrationValues { get; set; }

        public FrameSizeDefinition FrameSize { get; set; } = new();

        public bool IsAutoStartEnabled { get; set; }

        public string? DefaultCamera { get; set; }

        public CameraConfiguration CameraConfigurationValues { get; set; } = new();

        public NetworkSettings NetworkSettingValues { get; set; } = new();

        public PointCloudSettings PointCloudSettingValues { get; set; } = new();

        public PredictionSettings PredictionSettings { get; set; } = new();

        public ProcessingSettings ProcessingSettingValues { get; set; } = new();

        public RemoteProcessingServiceSettings RemoteProcessingServiceSettingsValues { get; set; } = new();

        public TuioConfiguration TuioSettingValues { get; set; } = new();

        public string GetCompleteValues()
        {
            var result = $"{DefaultCamera} | ";
            result += $"{CameraConfigurationValues.GetCameraDefinitionString()}";
            result += $"{nameof(IsAutoStartEnabled)}: {IsAutoStartEnabled}{Environment.NewLine}";
            result += $"{nameof(UseKalmanFilter)}: {UseKalmanFilter} | ";
            result += $"{nameof(UseJpda)}: {UseJpda} | ";
            result += $"{nameof(UseMinimumCostAssignment)}: {UseMinimumCostAssignment} | ";
            result += $"{nameof(AssignmentMissCost)}: {AssignmentMissCost} | ";
            result += $"{nameof(AssignmentBirthCost)}: {AssignmentBirthCost}{Environment.NewLine}";
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
