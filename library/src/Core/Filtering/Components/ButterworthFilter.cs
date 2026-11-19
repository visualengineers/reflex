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
                for (var axis = 0; axis < 3; axis++)
                    (_state[axis], _derivative[axis]) = Transition(
                        _state[axis], _derivative[axis], previous[axis], values[axis], dt);
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
            var result = new double[input.Length];
            result[0] = input[0];
            var derivative = 0d;
            for (var i = 1; i < input.Length; i++)
            {
                var dt = TimesSeconds[i] - TimesSeconds[i - 1];
                (result[i], derivative) = Transition(result[i - 1], derivative, input[i - 1], input[i], dt);
            }
            return result;
        }

        /// <summary>Exact damped state transition for a linearly changing input over dt seconds.</summary>
        private (double Value, double Derivative) Transition(double value, double derivative,
            double previousInput, double input, double dt)
        {
            var omega = 2 * Math.PI * _cutoffHz;
            var alpha = omega / Math.Sqrt(2);
            var slope = (input - previousInput) / dt;
            var offset = 2 * alpha * slope / (omega * omega);
            var error = value - previousInput + offset;
            var errorDerivative = derivative - slope;
            var decay = Math.Exp(-alpha * dt);
            var cos = Math.Cos(alpha * dt);
            var sin = Math.Sin(alpha * dt);
            return (input - offset + decay * (error * cos + (errorDerivative + alpha * error) / alpha * sin),
                slope + decay * (errorDerivative * cos -
                    (alpha * errorDerivative + omega * omega * error) / alpha * sin));
        }
    }
}
