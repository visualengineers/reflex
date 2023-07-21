using MathNet.Numerics.LinearAlgebra;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Filtering.Components
{
    /// <summary>
    /// Multiplies every point of a <see cref="PointCloud3"/> with a calibariation matrix.
    /// </summary>
    public class CalibrationFilter
    {
        public static float[,] UnitMatrix2X2 = {
            { 1.0f, 0.0f },
            { 0.0f, 1.0f },
        };

        private Matrix<float> _calibration;

        /// <summary>
        /// Gets the calibration.
        /// </summary>
        /// <value>
        /// The calibration.
        /// </value>
        public Matrix<float> Calibration
        {
            get => _calibration ?? Matrix<float>.Build.DenseOfArray(UnitMatrix2X2);
            set => _calibration = value;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="CalibrationFilter"/> class.
        /// </summary>
        public CalibrationFilter()
        {
            Calibration = Matrix<float>.Build.DenseOfArray(UnitMatrix2X2);
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="CalibrationFilter"/> class.
        /// </summary>
        /// <param name="calibration">The calibration.</param>
        public CalibrationFilter(Matrix<float> calibration)
        {
            Calibration = calibration;
        }

        /// <summary>
        /// Filters this instance.
        /// </summary>
        public void Filter(PointCloud3 target)
        {
            var targetRef = target.AsArray();
            var size = target.Size;
            var srcVector = Vector<float>.Build.Dense(new[] { 0f, 0f });

            for (var i = 0; i < size; ++i)
            {
                var vector = targetRef[i];
                srcVector[0] = vector.X;
                srcVector[1] = vector.Y;

                var trgVector = Calibration.Multiply(srcVector);
                vector.X = trgVector[0];
                vector.Y = trgVector[1];
            }
        }
    }
}
