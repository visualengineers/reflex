using System;
using ReFlex.Core.Common.Components;
using Math = System.Math;

namespace ReFlex.Core.Filtering.Components
{
    /// <summary>
    /// Second-order continuous-time Butterworth low-pass with a cutoff in Hz. The exact state
    /// transition assumes linear input between real samples; arbitrary gaps remain stable.
    /// Unlike fixed biquad coefficients, this does not change cutoff when the cadence changes.
    /// </summary>
    public class ButterworthFilter : Base2DFilter
    {
        private readonly double _cutoffHz;
        public ButterworthFilter(int numSamplesMin = 3, double cutoffHz = 3) : base(numSamplesMin)
        {
            if (!double.IsFinite(cutoffHz) || cutoffHz <= 0)
                throw new ArgumentOutOfRangeException(nameof(cutoffHz));
            _cutoffHz = cutoffHz;
        }

        protected override void ComputeFit()
        {
            PolyX = Smooth(XData);
            PolyY = Smooth(YData);
            PolyZ = Smooth(ZData);
        }

        protected override Point3 Evaluate(int index) =>
            new((float)PolyX[index], (float)PolyY[index], (float)PolyZ[index]);

        private double[] Smooth(double[] input)
        {
            var omega = 2 * Math.PI * _cutoffHz;
            var alpha = omega / Math.Sqrt(2);
            var beta = alpha;
            var result = new double[input.Length];
            result[0] = input[0];
            var derivative = 0d;
            for (var i = 1; i < input.Length; i++)
            {
                var dt = TimesSeconds[i] - TimesSeconds[i - 1];
                var slope = (input[i] - input[i - 1]) / dt;
                // Particular solution for a linear input plus the exact damped homogeneous state.
                var offset = 2 * alpha * slope / (omega * omega);
                var error = result[i - 1] - input[i - 1] + offset;
                var errorDerivative = derivative - slope;
                var decay = Math.Exp(-alpha * dt);
                var cos = Math.Cos(beta * dt);
                var sin = Math.Sin(beta * dt);
                result[i] = input[i] - offset + decay * (error * cos + (errorDerivative + alpha * error) / beta * sin);
                derivative = slope + decay * (errorDerivative * cos -
                    (alpha * errorDerivative + omega * omega * error) / beta * sin);
            }
            return result;
        }
    }
}
