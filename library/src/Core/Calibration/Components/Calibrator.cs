using System;
using System.Collections.Generic;
using System.IO;
using System.Xml.Serialization;
using MathNet.Numerics.LinearAlgebra;

namespace ReFlex.Core.Calibration.Components
{
    public class Calibrator
    {
        public const string DefaultCalibrationFile = "DefaultCalibrationFile.xml";

        #region Fields
        
        private int _width;
        private int _height;
        private int _startX;
        private int _startY;

        private readonly float[,] _unitMat4X4 = {
            { 1.0f, 0.0f, 0.0f, 0.0f },
            { 0.0f, 1.0f, 0.0f, 0.0f },
            { 0.0f, 0.0f, 1.0f, 0.0f },
            { 0.0f, 0.0f, 0.0f, 1.0f }
        };

        private Matrix<float> _calibrationMatrix;
        private readonly Matrix<float> _unitMatrix;

        #endregion

        #region Properties

        public Matrix<float> CalibrationMatrix => _calibrationMatrix ?? _unitMatrix;

        public Util.Calibration CalibrationValues { get; private set; } = new Util.Calibration
        {
            SourceValues = new List<int[]>(),
            TargetValues = new List<int[]>(),
            UpperThreshold = 1010,
            LowerThreshold = 960,
            LastUpdated = new List<DateTime>()
        };

        public int CalibrationStage { get; private set; }

        public int Width
        {
            get => _width;
            private set
            {
                if (_width == value)
                    return;
                _width = value;
                UpdateSource();
            }
        }

        public int Height
        {
            get => _height;
            private set
            {
                if (_height == value)
                    return;
                _height = value;
                UpdateSource();
            }
        }

        public int StartX
        {
            get => _startX;
            private set {
                if (_startX == value)
                    return;
                _startX = value;
                UpdateSource();
            }
        }

        public int StartY
        {
            get => _startY;
            private set
            {
                if (_startY == value)
                    return;
                _startY = value;
                UpdateSource();
            }
        }

        #endregion

        #region Events

        public EventHandler<Matrix<float>> CalibrationUpdated;
        public EventHandler<Matrix<float>> CalibrationFinished;
        public EventHandler<Matrix<float>> CalibrationLoaded;


        #endregion

        #region Constructor

        public Calibrator() : this(500, 500, 10, 100)
        {
            
        }

        public Calibrator(int width, int height, int startX, int startY)
        {
            _width = width;
            _height = height;
            _startX = startX;
            _startY = startY;

            _unitMatrix = Matrix<float>.Build.DenseOfArray(_unitMat4X4);
            
            UpdateSource();
        }

        #endregion

        #region Public Methods

        public void SetFrameSize(int width, int height, int top, int left)
        {
            _startX = left;
            _startY = top;
            _width = width;
            _height = height;
            
            UpdateSource();
        }

        public void UpdateSource()
        {
            int[] init1 = { Width / 8 * 5 + StartX, Height / 3 + StartY, -1 };
            int[] init2 = { Width / 8 * 5 + StartX, Height / 3 * 2 + StartY, -1 };
            int[] init3 = { Width / 16 * 5 + StartX, Height / 3 * 2 + StartY, -1 };
            
            CalibrationValues.SourceValues.Clear();
            
            CalibrationValues.SourceValues.Add(init1);
            CalibrationValues.SourceValues.Add(init2);
            CalibrationValues.SourceValues.Add(init3);

            if (CalibrationValues.TargetValues.Count == 0)
            {
                CalibrationValues.TargetValues.Add(init1);
                CalibrationValues.TargetValues.Add(init2);
                CalibrationValues.TargetValues.Add(init3);
                
                CalibrationValues.LastUpdated.Add(DateTime.Now);
                CalibrationValues.LastUpdated.Add(DateTime.Now);
                CalibrationValues.LastUpdated.Add(DateTime.Now);
            }
            
            CalibrationUpdated?.Invoke(this, CalibrationMatrix);
        }

        public void UpdateTargetValue(int idx, int x, int y, int id)
        {
            if (CalibrationValues.TargetValues.Count <= idx)
                return;

            CalibrationValues.TargetValues[idx] = new[] { x, y, id };

            if (CalibrationValues.LastUpdated.Count > idx)
            {
                var lastUpdate = CalibrationValues.LastUpdated[idx];

                if (DateTime.Now - lastUpdate < TimeSpan.FromMilliseconds(500))
                    return;
            }

            if (CalibrationValues.TargetValues.Count == 3)
            {
                _calibrationMatrix = GenerateMappingMatrix();
                if (CalibrationValues.LastUpdated.Count > idx)
                    CalibrationValues.LastUpdated[idx] = DateTime.Now;
                Save();
                CalibrationFinished?.Invoke(this, CalibrationMatrix);
            }
        }

        public void AddTargetValue(int x, int y, int id)
        {
            if (CalibrationStage >= 0 && CalibrationStage < 3)
            {
                CalibrationValues.TargetValues.Add(new[] { x, y, id });
                CalibrationValues.LastUpdated.Add(DateTime.Now);
                CalibrationStage++;
                CalibrationUpdated?.Invoke(this, CalibrationMatrix);
            }

            if (CalibrationStage != 3)
                return;

            ComputeTransformation();
            CalibrationStage++;
            Save();
        }

        public void ComputeTransformation()
        {
            _calibrationMatrix = GenerateMappingMatrix();

            ValidateCalibrationMatrix();

            CalibrationFinished?.Invoke(this, CalibrationMatrix);
        }

        public void Reset()
        {
            _calibrationMatrix = null;
            CalibrationStage = 0;
            CalibrationValues.TargetValues.Clear();
            CalibrationValues.LastUpdated.Clear();
            CalibrationUpdated?.Invoke(this, CalibrationMatrix);
        }

        [Obsolete]
        public void Load(string xmlSerializedText)
        {
            var ser = new XmlSerializer(typeof(Util.Calibration));
            using (var text = new StringReader(xmlSerializedText))
            {
               var result = (Util.Calibration)ser.Deserialize(text);
               SetCalibrationValues(result);
            }
        }
        
        public void Load(Util.Calibration calibration)
        {
            SetCalibrationValues(calibration);
        }
        
        private void SetCalibrationValues(Util.Calibration calibration)
        {
            try
            {

                CalibrationValues = new Util.Calibration
                {
                    LastUpdated = calibration.LastUpdated ?? new List<DateTime>(),
                    UpperThreshold = calibration.UpperThreshold,
                    LowerThreshold = calibration.LowerThreshold,
                    SourceValues = CalibrationValues.SourceValues ?? calibration.SourceValues,
                    TargetValues = calibration.TargetValues ?? new List<int[]>()
                };

                _calibrationMatrix = GenerateMappingMatrix();
                CalibrationLoaded?.Invoke(this, CalibrationMatrix);

            }
            catch (Exception exc)
            {
                Console.Write(exc.Message);
            }
        }

        [Obsolete]
        public string Save(string fileName = DefaultCalibrationFile)
        {
            var ser = new XmlSerializer(typeof(Util.Calibration));
            using (var text = new StringWriter())
            {
                try
                {
                    ser.Serialize(text, CalibrationValues);
                }
                catch (Exception exc)
                {
                    Console.Write(exc.Message);
                }

                return text.ToString();
            }
        }

        #endregion

        #region Auxiliary Methods

        private Matrix<float> GenerateMappingMatrix()
        {
            if (CalibrationValues.SourceValues == null
                || CalibrationValues.SourceValues.Count != 3
                || CalibrationValues.TargetValues == null 
                || CalibrationValues.TargetValues.Count != 3)
                return _unitMatrix;
            
            float[,] oPoints = {
                { CalibrationValues.SourceValues[0][0], CalibrationValues.SourceValues[1][0], CalibrationValues.SourceValues[2][0], 0.0f },
                { CalibrationValues.SourceValues[0][1], CalibrationValues.SourceValues[1][1], CalibrationValues.SourceValues[2][1], 0.0f },
                { 1.0f, 1.0f, 1.0f, 0.0f },
                { 0.0f, 0.0f, 0.0f, 1.0f }
            };

            float[,] nPoints = {
                { CalibrationValues.TargetValues[0][0], CalibrationValues.TargetValues[1][0], CalibrationValues.TargetValues[2][0], 0.0f },
                { CalibrationValues.TargetValues[0][1], CalibrationValues.TargetValues[1][1], CalibrationValues.TargetValues[2][1], 0.0f },
                { 1.0f, 1.0f, 1.0f, 0.0f },
                { 0.0f, 0.0f, 0.0f, 1.0f }
            };

            var oPointsMat = Matrix<float>.Build.DenseOfArray(oPoints);
            var nPointsMat = Matrix<float>.Build.DenseOfArray(nPoints);

            return nPointsMat.Multiply(oPointsMat.Inverse()).Inverse();
        }

        private void ValidateCalibrationMatrix()
        {
            var isValid = _calibrationMatrix.ForAll(val => !float.IsInfinity(val) && !float.IsNaN(val) && val >= float.MinValue && val <= float.MaxValue);
            if (!isValid)
                _calibrationMatrix = _unitMatrix;
        }

        #endregion
    }

}
