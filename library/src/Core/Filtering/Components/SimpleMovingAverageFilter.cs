using System;
using Math = System.Math;
using System.Collections.Generic;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Filtering.Components
{
    /// <summary>Causal moving average. Output i uses at most windowSize samples ending at i.</summary>
    public class SimpleMovingAverageFilter : IPointFilter
    {
        private readonly int _size;
        public SimpleMovingAverageFilter(int windowSize) => _size = Math.Max(1, windowSize);

        public List<Point3> Process(List<Point3> samples)
        {
            if (samples == null) return null;
            var result = new List<Point3>(samples.Count);
            var sum = new Point3();
            for (var i = 0; i < samples.Count; i++)
            {
                sum += samples[i];
                if (i >= _size) sum -= samples[i - _size];
                result.Add(sum / Math.Min(i + 1, _size));
            }
            return result;
        }
    }
}
