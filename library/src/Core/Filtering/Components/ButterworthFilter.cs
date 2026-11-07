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

        private double? _lastTime;
        private Point3 _lastInput;
        private readonly double[] _state = new double[3];
        private readonly double[] _derivative = new double[3];

        /// <summary>Advance one track's persistent filter state using a new real measurement only.</summary>
        public Point3 ProcessSample(Point3 input, double timestampSeconds)
        {
            if (!double.IsFinite(timestampSeconds) || (_lastTime.HasValue && timestampSeconds <= _lastTime.Value))
                throw new ArgumentOutOfRangeException(nameof(timestampSeconds));
            var values = new[] { (double)input.X, input.Y, input.Z };
            if (!_lastTime.HasValue)
                Array.Copy(values, _state, 3);
            else
            {
                var previous = new[] { (double)_lastInput.X, _lastInput.Y, _lastInput.Z };
                var dt = timestampSeconds - _lastTime.Value;
                var omega = 2 * Math.PI * _cutoffHz;
                var alpha = omega / Math.Sqrt(2);
                var decay = Math.Exp(-alpha * dt);
                var cos = Math.Cos(alpha * dt);
                var sin = Math.Sin(alpha * dt);
                for (var axis = 0; axis < 3; axis++)
                {
                    var slope = (values[axis] - previous[axis]) / dt;
                    var offset = 2 * alpha * slope / (omega * omega);
                    var error = _state[axis] - previous[axis] + offset;
                    var errorDerivative = _derivative[axis] - slope;
                    _state[axis] = values[axis] - offset + decay *
                        (error * cos + (errorDerivative + alpha * error) / alpha * sin);
                    _derivative[axis] = slope + decay * (errorDerivative * cos -
                        (alpha * errorDerivative + omega * omega * error) / alpha * sin);
                }
            }
            _lastInput = new Point3(input);
            _lastTime = timestampSeconds;
            return new Point3((float)_state[0], (float)_state[1], (float)_state[2]);
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
