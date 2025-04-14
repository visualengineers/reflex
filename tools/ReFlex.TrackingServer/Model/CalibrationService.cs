using Implementation.Interfaces;
using MathNet.Numerics.LinearAlgebra;
using Microsoft.AspNetCore.SignalR;
using NLog;
using ReFlex.Core.Calibration.Components;
using ReFlex.Core.Calibration.Util;
using ReFlex.Core.Common.Components;
using ReFlex.Server.Data.Calibration;
using ReFlex.Server.Data.Config;
using TrackingServer.Hubs;
using TrackingServer.Util;

namespace TrackingServer.Model
{
    public class CalibrationService : SignalRBaseService<string, CalibrationHub>
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        private readonly ICalibrationManager _calibrationManager;
        private readonly Calibrator _calibrator;
        private readonly ConfigurationManager _configurationManager;

        private Matrix<float> _calibrationResult;

        private readonly HubGroupSubscriptionManager<Calibration>_calibrationSubscriptions;

        private bool _isCalibrationFinished;

        public bool IsCalibrationFinished
        {
            get => _isCalibrationFinished;
            set
            {
                if (_isCalibrationFinished == value)
                    return;
                _isCalibrationFinished = value;
                CurrentState.OnNext(GetState());
            }
        }

        public string State
        {
            get => CurrentState.Value;
        }

        public FrameSizeDefinition Frame =>
            _calibrator == null
                ? new FrameSizeDefinition(0, 0, 0, 0)
                : new FrameSizeDefinition(_calibrator);

        public float[,] TransformationMatrix => _calibrator.CalibrationMatrix.ToArray();

        public CalibrationPoint[] SourceValues =>
            (_calibrator?.CalibrationValues.SourceValues?.Select(sourceValue => new CalibrationPoint(sourceValue)) ??
             new List<CalibrationPoint>()).ToArray();

        public CalibrationPoint[] TargetValues => (_calibrator?.CalibrationValues.TargetValues?.Select(targetValue => new CalibrationPoint(targetValue)) ?? new List<CalibrationPoint>()).ToArray();

        public IHubGroupSubscriptionManager CalibrationSubscriptionManager => _calibrationSubscriptions;


        public CalibrationService(ICalibrationManager calibrationManager,
            Calibrator calibrator, ConfigurationManager configurationManager, IHubContext<CalibrationHub> hubContext)
        : base(CalibrationHub.CalibrationStateGroup, hubContext)
        {
            _calibrationManager = calibrationManager;
            _calibrator = calibrator;
            _configurationManager = configurationManager;

            SetWindowFrame(_configurationManager.Settings.FrameSize);

            _calibrator.CalibrationUpdated += OnCalibrationUpdated;
            _calibrator.CalibrationFinished += OnCalibrationFinished;
            _calibrator.CalibrationLoaded += OnCalibrationLoaded;

            _calibrationSubscriptions = new HubGroupSubscriptionManager<Calibration>("calibration");
            _calibrationSubscriptions.Setup(
                (handler) => _calibrationManager.CalibrationUpdated += handler,
                (handler) => _calibrationManager.CalibrationUpdated -= handler,
                hubContext,
                CalibrationHub.CalibrationsGroup);

            CurrentState.OnNext(GetState());

            Logger.Info($"Sucessfully initialized {GetType().FullName}." );
        }

        public FrameSizeDefinition SetWindowFrame(FrameSizeDefinition sizeDef)
        {
            _calibrator.SetFrameSize(
                sizeDef?.Width ?? 500,
                sizeDef?.Height ?? 350,
                sizeDef?.Top ?? 0,
                sizeDef?.Left ?? 0);

            _calibrationManager.Initialize(_calibrator, _configurationManager.Settings.CalibrationValues);

            _configurationManager.Settings.FrameSize = sizeDef;

            return Frame;
        }

        public bool ValidateTargetPoint(int targetX, int targetY, out string errorMessage)
        {
            var result = true;

            var checkLeft = 0;
            var checkTop = 0;
            var checkRight = _configurationManager.Settings.CameraConfigurationValues.Width;
            var checkBottom = _configurationManager.Settings.CameraConfigurationValues.Height;

            errorMessage = "";

            if (targetX < checkLeft)
            {
                result = false;
                errorMessage +=
                    $"Invalid X-Position: must be larger than {checkLeft}. Provided value is {targetX}";
            }

            if (targetX > checkRight)
            {
                result = false;
                errorMessage +=
                    $"Invalid X-Position: must be smaller than {checkRight} (max horizontal resolution of camera). Provided value is {targetX}";
            }

            if (targetY < checkTop)
            {
                result = false;
                errorMessage +=
                    $"Invalid Y-Position: must be larger than {checkTop}. Provided value is {targetY}";
            }

            if (targetY > checkBottom)
            {
                result = false;
                errorMessage +=
                    $"Invalid Y-Position: must be smaller than {checkBottom} (max vertical resolution of camera). Provided value is {targetY}";
            }

            return result;
        }

        public void UpdateCalibration(int idx, int targetX, int targetY, int id)
        {
            _calibrator.UpdateTargetValue(idx, targetX, targetY, id);
        }

        public void ComputeTransformation()
        {
            _calibrator.ComputeTransformation();
        }

        public void AddCalibrationPoint(int targetX, int targetY, int id)
        {
            _calibrator.AddTargetValue(targetX, targetY, id);
        }

        public void RestartCalibration()
        {
            _calibrationManager.ResetCalibration();
            _calibrator.ComputeTransformation();

            CurrentState.OnNext(GetState());
        }

        public Interaction[] GetCalibratedInteractions(IEnumerable<Interaction> interactions)
        {
            return interactions.Select(rawInteraction => _calibrationManager.Calibrate(rawInteraction)).ToArray();
        }

        public void FinishCalibration()
        {
            if (_calibrationResult == null)
                return;

            _calibrationManager.CalibrationMatrix = _calibrationResult;
            SaveCalibration();

            _calibrationManager.Initialize(_calibrator, _configurationManager.Settings.CalibrationValues);

            CurrentState.OnNext(GetState());
        }

        private void OnCalibrationUpdated(object sender, Matrix<float> calibrationMatrix)
        {
            _calibrationResult = calibrationMatrix;
            FinishCalibration();
        }

        private void OnCalibrationFinished(object sender, Matrix<float> calibrationMatrix)
        {
            _calibrationResult = calibrationMatrix;
            IsCalibrationFinished = true;
        }

        private void OnCalibrationLoaded(object sender, Matrix<float> calibrationMatrix)
        {
            _calibrationResult = calibrationMatrix;
        }

        private void SaveCalibration()
        {
            _configurationManager.Settings.CalibrationValues = _calibrator.CalibrationValues;
            _configurationManager.Update(_configurationManager.Settings);
        }

        public sealed override string GetState()
        {
            var calibrationState = _calibrationResult != null ? "Calibration valid" : "Calibration invalid";

            return IsCalibrationFinished ? calibrationState : "Calibration in Progress";
        }

        public override void Dispose()
        {
            base.Dispose();

            _calibrator.CalibrationUpdated -= OnCalibrationUpdated;
            _calibrator.CalibrationFinished -= OnCalibrationFinished;
            _calibrator.CalibrationLoaded -= OnCalibrationLoaded;

            GC.SuppressFinalize(this);
        }
    }
}
