using System;
using Implementation.Interfaces;
using MathNet.Numerics.LinearAlgebra;
using ReFlex.Core.Calibration.Components;
using ReFlex.Core.Calibration.Util;
using ReFlex.Core.Common.Components;

namespace Implementation.Components
{
    public class CalibrationManager : ICalibrationManager, IDisposable
    {
        private Calibrator _calibrator;

        private readonly float[,] _unitMat4X4 = {
            { 1.0f, 0.0f, 0.0f, 0.0f },
            { 0.0f, 1.0f, 0.0f, 0.0f },
            { 0.0f, 0.0f, 1.0f, 0.0f },
            { 0.0f, 0.0f, 0.0f, 1.0f }
        };

        public event EventHandler<Calibration> CalibrationUpdated;
        public Matrix<float> CalibrationMatrix { get; set; }     

        public Matrix<float> UnitMatrix4X4 => Matrix<float>.Build.DenseOfArray(_unitMat4X4);

        [Obsolete]
        public void Initialize(Calibrator calibratorInstance, string defaultCalibration)
        {
            CalibrationMatrix = Matrix<float>.Build.DenseOfArray(_unitMat4X4);
            _calibrator = calibratorInstance;
            LoadCalibration(defaultCalibration);
            CalibrationMatrix = _calibrator.CalibrationMatrix;

            _calibrator.CalibrationFinished += OnCalibratrionFinished;
        }
        
        public void Initialize(Calibrator calibratorInstance, Calibration defaultCalibration)
        {
            CalibrationMatrix = Matrix<float>.Build.DenseOfArray(_unitMat4X4);
            _calibrator = calibratorInstance;
            _calibrator.Load(defaultCalibration);
            CalibrationMatrix = _calibrator.CalibrationMatrix;

            _calibrator.CalibrationFinished += OnCalibratrionFinished;
        }

        private void OnCalibratrionFinished(object sender, Matrix<float> e)
        {
            OnCalibrationUpdated();
        }

        public Interaction Calibrate(Interaction source)
        {
            if (source == null || CalibrationMatrix == null)
                return default(Interaction);

            var p3 = new Point3();
            p3.Set(source.Position);

            var inter = new Interaction(p3,source); 

            inter.Position.X = (inter.Position.X * CalibrationMatrix.AsColumnMajorArray()[0] +
                                inter.Position.Y * CalibrationMatrix.AsColumnMajorArray()[4] +
                                1.0f * CalibrationMatrix.AsColumnMajorArray()[8] - _calibrator.StartX) / _calibrator.Width;

            if (inter.Position.X < 0)
                inter.Position.X = 0;

            if (inter.Position.X > 1)
                inter.Position.X = 1;

            inter.Position.Y = (inter.Position.X * CalibrationMatrix.AsColumnMajorArray()[1] +
                                inter.Position.Y * CalibrationMatrix.AsColumnMajorArray()[5] +
                                1.0f * CalibrationMatrix.AsColumnMajorArray()[9] - _calibrator.StartY) / _calibrator.Height;

            if (inter.Position.Y < 0)
                inter.Position.Y = 0;

            if (inter.Position.Y > 1)
                inter.Position.Y = 1;

            inter.Position.Z = inter.Position.Z * CalibrationMatrix.AsColumnMajorArray()[10];

            return inter;
        }

        [Obsolete]
        public void LoadCalibration(string calib)
        {

            if (string.IsNullOrWhiteSpace(calib))
                return;
            _calibrator.Load(calib);
            
            OnCalibrationUpdated();
        }

        public void ResetCalibration()
        {
            CalibrationMatrix = UnitMatrix4X4;
            _calibrator.Reset();
            _calibrator.UpdateSource();
            
            OnCalibrationUpdated();
        }

        private void OnCalibrationUpdated()
        {
            if (_calibrator != null)
                CalibrationUpdated?.Invoke(this, _calibrator.CalibrationValues);
        }

        public void Dispose()
        {
            if (_calibrator != null)
                _calibrator.CalibrationFinished -= OnCalibratrionFinished;
        }
    }
}
