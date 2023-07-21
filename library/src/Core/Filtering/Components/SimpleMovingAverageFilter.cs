using System.Collections.Generic;
using System.Linq;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Filtering.Components
{
    public class SimpleMovingAverageFilter : IPointFilter
    {
        private readonly int _size;
        
        public SimpleMovingAverageFilter(int windowSize)
        {
            _size = windowSize;
        }
        
        public List<Point3> Process(List<Point3> samples)
        {
            if (samples == null || samples.Count < _size)
                return samples;

            var result = new List<Point3>();
            for (var index = 0; index < samples.Count; index++)
            {
                // compute (initial) average
                if (index < _size)
                {
                    var avg = ComputeAverage(result, samples[index]);
                    result.Add(avg);
                }
                // compute online moving average (cf. https://de.wikipedia.org/wiki/Gleitender_Mittelwert#Online-Berechnung)
                else if(result.Count > index && samples.Count > index)
                {
                    var avg = result[index - 1] + (samples[index] - samples[index - _size]) / index;
                    result.Add(avg);

                }
            }

            return result;
        }

        private static Point3 ComputeAverage(IReadOnlyCollection<Point3> prev, Point3 currentPoint)
        {
            currentPoint = prev.Aggregate(currentPoint, (current, p) => current + p);

            return currentPoint / (prev.Count + 1);
        }
    }
}