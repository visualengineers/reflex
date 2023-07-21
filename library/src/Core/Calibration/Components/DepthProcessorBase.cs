using System;
using MathNet.Numerics.LinearAlgebra;

namespace ReFlex.Core.Calibration.Components
{
    public abstract class DepthProcessorBase
    {
        #region Properties

        public const double MaxDepthValue = 2048.0;

        protected int Width;
        protected int Height;

        #endregion

        #region Constructor

        protected DepthProcessorBase(int width, int height)
        {
            Width = width;
            Height = height;
        }

        #endregion

        #region Methods

        protected int ConvertDim21(int x, int y) => 
            x + (Width * y);

        protected double[] ConvertDim12(int i) =>
            new[] { i % Width, Math.Floor((i / (double)Width)) };

        protected Vector<double> InterpolateVector(Vector<double> src, Vector<double> target, double weight)
        {
            var result = new[]
            {
                src[0] + (target[0] - src[0]) * weight,
                src[1] + (target[1] - src[1]) * weight,
                src[2] + (target[2] - src[2]) * weight
            };

            return Vector<double>.Build.DenseOfArray(result);
        }

        public abstract Vector<double>[,] Process(double[] depthValues);

        #endregion
    }

}
