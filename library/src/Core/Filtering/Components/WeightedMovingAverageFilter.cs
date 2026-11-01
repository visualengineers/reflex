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
                double x = 0, y = 0, z = 0;
                for (var j = 0; j < count; j++)
                {
                    var point = samples[i - count + 1 + j];
                    var weight = (double)j + 1;
                    x += point.X * weight;
                    y += point.Y * weight;
                    z += point.Z * weight;
                }
                var totalWeight = (double)count * (count + 1d) / 2;
                result.Add(new Point3((float)(x / totalWeight), (float)(y / totalWeight), (float)(z / totalWeight)));
            }
            return result;
        }
    }
}
