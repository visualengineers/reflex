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
            // Accumulate in double: finite float inputs must not overflow before normalization.
            double x = 0, y = 0, z = 0;
            for (var i = 0; i < samples.Count; i++)
            {
                x += samples[i].X;
                y += samples[i].Y;
                z += samples[i].Z;
                if (i >= _size)
                {
                    x -= samples[i - _size].X;
                    y -= samples[i - _size].Y;
                    z -= samples[i - _size].Z;
                }
                var count = Math.Min(i + 1, _size);
                result.Add(new Point3((float)(x / count), (float)(y / count), (float)(z / count)));
            }
            return result;
        }
    }
}
