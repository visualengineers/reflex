using System;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Interactivity.Util;

/// <summary>Independent XY constant-velocity Kalman models. Time is seconds, positions are
/// sensor pixels. Forecasts are read-only; only associated real measurements advance the state.</summary>
internal sealed class KalmanContactMotion
{
    internal const double MeasurementVariance = 4; // pixel², measurement standard deviation 2 px
    // Replay-tuned for fast turns while retaining noise attenuation. At 30 Hz this adds
    // 4.94 pixel² of predicted position variance per step (previously 0.00494).
    internal const double AccelerationSpectralDensity = 400000; // pixel²/s³
    internal const double InitialVelocityVariance = 10000; // (pixel/s)²

    private sealed class Axis
    {
        public double Position;
        public double Velocity;
        public double PositionVariance = MeasurementVariance;
        public double CrossCovariance;
        public double VelocityVariance = InitialVelocityVariance;

        public (double Position, double Variance, double Cross, double VelocityVariance) Predict(double dt)
        {
            var variance = PositionVariance + 2 * dt * CrossCovariance + dt * dt * VelocityVariance
                + AccelerationSpectralDensity * dt * dt * dt / 3;
            var cross = CrossCovariance + dt * VelocityVariance + AccelerationSpectralDensity * dt * dt / 2;
            var velocityVariance = VelocityVariance + AccelerationSpectralDensity * dt;
            var position = Position + dt * Velocity;
            if (!double.IsFinite(position) || !double.IsFinite(variance) || !double.IsFinite(cross)
                || !double.IsFinite(velocityVariance))
                throw new ArgumentOutOfRangeException(nameof(dt), "Kalman forecast exceeds finite numeric range.");
            return (position, variance, cross, velocityVariance);
        }

        public void Correct(double measured, double dt)
        {
            var prediction = Predict(dt);
            var innovationVariance = prediction.Variance + MeasurementVariance;
            var positionGain = prediction.Variance / innovationVariance;
            var velocityGain = prediction.Cross / innovationVariance;
            var residual = measured - prediction.Position;
            Position = prediction.Position + positionGain * residual;
            Velocity += velocityGain * residual;
            // Joseph covariance update: (I-KH) P (I-KH)' + K R K'.
            var remaining = 1 - positionGain;
            PositionVariance = remaining * remaining * prediction.Variance
                + positionGain * positionGain * MeasurementVariance;
            CrossCovariance = remaining * (prediction.Cross - velocityGain * prediction.Variance)
                + positionGain * velocityGain * MeasurementVariance;
            VelocityVariance = prediction.VelocityVariance - 2 * velocityGain * prediction.Cross
                + velocityGain * velocityGain * innovationVariance;
        }
    }

    private readonly Axis _x;
    private readonly Axis _y;
    public double LastMeasurementTime { get; private set; }
    public int MeasurementCount { get; private set; } = 1;
    public Point3 Velocity => new((float)_x.Velocity, (float)_y.Velocity, 0);

    public KalmanContactMotion(Point3 measurement, double timestamp)
    {
        ValidateMeasurement(measurement, timestamp);
        _x = new Axis { Position = measurement.X };
        _y = new Axis { Position = measurement.Y };
        LastMeasurementTime = timestamp;
    }

    public void Update(Point3 measurement, double timestamp)
    {
        ValidateMeasurement(measurement, timestamp);
        if (timestamp <= LastMeasurementTime)
            throw new ArgumentOutOfRangeException(nameof(timestamp));
        var dt = timestamp - LastMeasurementTime;
        // Validate both predictions before either axis is corrected.
        _x.Predict(dt);
        _y.Predict(dt);
        _x.Correct(measurement.X, dt);
        _y.Correct(measurement.Y, dt);
        LastMeasurementTime = timestamp;
        MeasurementCount++;
    }

    public (Point3 Position, double VarianceX, double VarianceY) Predict(double timestamp, float depth)
    {
        if (!double.IsFinite(timestamp) || timestamp < LastMeasurementTime)
            throw new ArgumentOutOfRangeException(nameof(timestamp));
        var x = _x.Predict(timestamp - LastMeasurementTime);
        var y = _y.Predict(timestamp - LastMeasurementTime);
        return (new Point3((float)x.Position, (float)y.Position, depth), x.Variance, y.Variance);
    }

    private static void ValidateMeasurement(Point3 measurement, double timestamp)
    {
        if (measurement == null || !float.IsFinite(measurement.X) || !float.IsFinite(measurement.Y))
            throw new ArgumentOutOfRangeException(nameof(measurement));
        if (!double.IsFinite(timestamp))
            throw new ArgumentOutOfRangeException(nameof(timestamp));
    }
}
