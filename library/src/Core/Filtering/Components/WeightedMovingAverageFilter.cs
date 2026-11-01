using System;
using Math = System.Math;
using System.Collections.Generic;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Filtering.Components
{
    /// <summary>Causal average with deterministic linear weights: newest sample has greatest weight.</summary>
    public class WeightedMovingAverageFilter : IPointFilter
    {
        private readonly int _size;
        public WeightedMovingAverageFilter(int windowSize) => _size = Math.Max(1, windowSize);

        public List<Point3> Process(List<Point3> samples)
        {
            if (samples == null) return null;
            var result = new List<Point3>(samples.Count);
            for (var i = 0; i < samples.Count; i++)
            {
                var count = Math.Min(i + 1, _size);
                var sum = new Point3();
                for (var j = 0; j < count; j++) sum += samples[i - count + 1 + j] * (j + 1);
                result.Add(sum / (count * (count + 1) / 2f));
            }
            return result;
        }
    }
}
