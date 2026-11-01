using System;
using System.Collections.Generic;
using System.Linq;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Filtering.Components
{
    /// <summary>Temporal filter base. The tracker always passes monotonic measurement times in seconds.</summary>
    public abstract class Base2DFilter : IPointFilter
    {
        protected double[] XData { get; private set; }
        protected double[] YData { get; private set; }
        protected double[] ZData { get; private set; }

        /// <summary>Actual elapsed seconds, centered at the newest measurement.</summary>
        protected double[] TimesSeconds { get; private set; }

        /// <summary>Time coordinates normalized to [-1,0] for stable polynomial fitting.</summary>
        protected double[] Ticks { get; private set; }
        protected double[] PolyX { get; set; }
        protected double[] PolyY { get; set; }
        protected double[] PolyZ { get; set; }
        protected int NumSamplesMin;

        protected Base2DFilter(int numSamplesMin) => NumSamplesMin = numSamplesMin >= 1
            ? numSamplesMin : throw new ArgumentOutOfRangeException(nameof(numSamplesMin));

        /// <summary>
        /// Compatibility API for untimed callers: assumes 30 Hz. For real observations use the
        /// timestamp overload; sample indices alone cannot reconstruct elapsed time.
        /// </summary>
        public List<Point3> Process(List<Point3> samples) => samples == null ? null :
            Process(samples, samples.Select((_, index) => index / 30d).ToArray());

        public List<Point3> Process(List<Point3> samples, IReadOnlyList<double> timestampsSeconds)
        {
            ArgumentNullException.ThrowIfNull(samples);
            ArgumentNullException.ThrowIfNull(timestampsSeconds);
            if (samples.Count != timestampsSeconds.Count)
                throw new ArgumentException("Every sample needs a timestamp.", nameof(timestampsSeconds));
            for (var i = 0; i < timestampsSeconds.Count; i++)
                if (!double.IsFinite(timestampsSeconds[i]) || (i > 0 && timestampsSeconds[i] <= timestampsSeconds[i - 1]))
                    throw new ArgumentException("Timestamps must be finite and strictly increasing.", nameof(timestampsSeconds));
            if (samples.Count < NumSamplesMin || samples.Count < 2)
                return samples.Select(point => (Point3)point.Copy()).ToList();

            TimesSeconds = timestampsSeconds.Select(time => time - timestampsSeconds[^1]).ToArray();
            var span = -TimesSeconds[0];
            Ticks = TimesSeconds.Select(time => time / span).ToArray();
            XData = samples.Select(point => (double)point.X).ToArray();
            YData = samples.Select(point => (double)point.Y).ToArray();
            ZData = samples.Select(point => (double)point.Z).ToArray();
            ComputeFit();
            return Enumerable.Range(0, samples.Count).Select(Evaluate).ToList();
        }

        /// <summary>Evaluate at the sample's actual time (Ticks[index]), or return its filtered state.</summary>
        protected abstract Point3 Evaluate(int index);
        protected abstract void ComputeFit();
    }
}
