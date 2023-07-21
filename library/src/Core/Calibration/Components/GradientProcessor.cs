using System;
using MathNet.Numerics.LinearAlgebra;

namespace ReFlex.Core.Calibration.Components
{
    public class GradientProcessor : DepthProcessorBase
    {
        #region Fields;

        // private int _threshold;
        private readonly int _skip;
        private Vector<double>[,] _lastProcessed;
        private Util.Calibration _calibration;

        private static readonly int[] XWeights = { -1, -1, 0, 1, 1, 1, 0, -1, -2, -2, -1, 0, 1, 2, 2, 2, 1, 0, -1, -2 };
        private static readonly int[] YWeights = { 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -2, -2, -2, -1, 0, 1, 2, 2, 2, 1 };

        #endregion

        #region constructor

        public GradientProcessor(Util.Calibration calibration, int width, int height, int skip) : base(width, height)
        {
            _skip = skip;
            _calibration = calibration;
        }

        #endregion

        #region Implementation of Abstract Methods


        public override Vector<double>[,] Process(double[] depthValues)
        {
            var result = new Vector<double>[Width / _skip, Height / _skip];
            var offset = -1;

            for (int i = 0; i < depthValues.Length; i += _skip)
            {
                var vec = Vector<double>.Build.Sparse(3);
                var curr = depthValues[i];

                // Smoothing: Can be removed ?

                for (var j = 0; j < XWeights.Length; j++)
                {
                    var n = i + ConvertDim21(XWeights[j], YWeights[j]);
                    if (n < depthValues.Length && n >= 0 && Math.Abs(depthValues[0] - MaxDepthValue) > double.Epsilon)
                    {
                        var diff = depthValues[n] - curr;
                        var sub = new[] { XWeights[j] * diff, YWeights[j] * diff, 0 };
                        vec = vec.Subtract(Vector<double>.Build.DenseOfArray(sub));
                    }
                    else
                    {
                        vec[0] = 0;
                        vec[1] = 0;
                    }
                }

                // Smoothing: end

                if (i % (Width * _skip) == 0)
                    offset++;
                vec = vec.Multiply(.1);

                if (vec.Norm(2) > 3)
                    vec = vec.Normalize(2).Multiply(3.0);

                if (curr > _calibration.UpperThreshold && curr < _calibration.LowerThreshold)
                {
                    result[i % Width / _skip, offset] = Vector<double>.Build.Sparse(3);
                    continue;
                }

                if (_lastProcessed == null)
                {
                    result[i % Width / _skip, offset] = vec;
                }
                else
                {
                    var last = _lastProcessed[i % Width / _skip, offset];
                    result[i % Width / _skip, offset] = InterpolateVector(vec, last, 0.7);
                }
            }

            _lastProcessed = result;
            return result;
        }

        #endregion
    }

}
