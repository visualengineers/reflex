using System.Collections.Generic;
using System.Linq;
using MathNet.Numerics;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Interactivity.Util;

/// <summary>Fits real timestamped measurements and creates forecasts without updating track state.</summary>
internal static class ContactMotion
{
    public static (Point3 Velocity, Point3 Acceleration, int Count) Estimate(
        IEnumerable<(double Time, Interaction Measurement)> measurements, double lastSeenTime, int sampleCount, bool useAcceleration)
    {
        var samples = measurements.TakeLast(sampleCount)
            .Select(sample => (sample.Time, Position: sample.Measurement.Position)).ToArray();
        if (samples.Length < 2)
            return (new Point3(), new Point3(), samples.Length);

        // Center times at the newest measurement: the fitted linear coefficient is v(now),
        // not the average velocity half-way between measurements. Gaps retain their duration.
        var span = lastSeenTime - samples[0].Time;
        // Normalize the independent variable for well-conditioned fits, then recover derivatives per second.
        var times = samples.Select(sample => (sample.Time - lastSeenTime) / span).ToArray();
        var order = useAcceleration && samples.Length >= 3 ? 2 : 1;
        var x = Fit.Polynomial(times, samples.Select(sample => (double)sample.Position.X).ToArray(), order);
        var y = Fit.Polynomial(times, samples.Select(sample => (double)sample.Position.Y).ToArray(), order);
        var z = Fit.Polynomial(times, samples.Select(sample => (double)sample.Position.Z).ToArray(), order);
        var velocity = new Point3((float)(x[1] / span), (float)(y[1] / span), (float)(z[1] / span));
        var acceleration = order == 2
            ? new Point3((float)(2 * x[2] / (span * span)),
                (float)(2 * y[2] / (span * span)), (float)(2 * z[2] / (span * span)))
            : new Point3();
        return (velocity, acceleration, samples.Length);
    }

    public static InteractionVelocity Forecast(Point3 position,
        (Point3 Velocity, Point3 Acceleration, int Count) motion, float accelerationWeight, float horizon)
    {
        var forecast = new InteractionVelocity();
        forecast.Update(position, motion.Velocity, motion.Acceleration, accelerationWeight, horizon);
        return forecast;
    }
}
