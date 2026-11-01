using System;
using Math = System.Math;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Filtering.Components
{
    /// <summary>
    /// Causal second-order Butterworth low-pass, cutoff in cycles per processed sample.
    /// Seeded with the first measurement to preserve constant signals during warm-up.
    /// </summary>
    public class ButterworthFilter : Base2DFilter
    {
        public ButterworthFilter(int numSamplesMin = 3) : base(numSamplesMin) { }

        protected override void ComputeFit()
        {
            PolyX = Smooth(XData);
            PolyY = Smooth(YData);
            PolyZ = Smooth(ZData);
        }

        protected override Point3 Evaluate(int index) =>
            new((float)PolyX[index], (float)PolyY[index], (float)PolyZ[index]);

        private static double[] Smooth(double[] input)
        {
            const double cutoff = .1;
            var k = Math.Tan(Math.PI * cutoff);
            var norm = 1 / (1 + Math.Sqrt(2) * k + k * k);
            var b0 = k * k * norm;
            var b1 = 2 * b0;
            var a1 = 2 * (k * k - 1) * norm;
            var a2 = (1 - Math.Sqrt(2) * k + k * k) * norm;
            var result = new double[input.Length];
            var x1 = input[0];
            var x2 = x1;
            var y1 = x1;
            var y2 = x1;
            for (var i = 0; i < input.Length; i++)
            {
                result[i] = b0 * input[i] + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2;
                x2 = x1;
                x1 = input[i];
                y2 = y1;
                y1 = result[i];
            }
            return result;
        }
    }
}
