using System;
using MathNet.Numerics.LinearAlgebra;
using ReFlex.Core.Calibration.Components;
using ReFlex.Core.Calibration.Util;
using ReFlex.Core.Common.Components;

namespace Implementation.Interfaces
{
    public interface ICalibrationManager
    {
        event EventHandler<Calibration> CalibrationUpdated;

        Matrix<float> CalibrationMatrix { get; set; }

        Interaction Calibrate(Interaction source);

        [Obsolete]
        void Initialize(Calibrator calibratorInstance, string defaultCalibration);
        
        void Initialize(Calibrator calibratorInstance, Calibration defaultCalibration);

        void LoadCalibration(string calibration);

        void ResetCalibration();
    }
}
