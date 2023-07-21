using System.Collections.Generic;
using System.Linq;
using MathNet.Numerics.Distributions;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Filtering.Components
{
    public class WeightedMovingAverageFilter : IPointFilter
    {
        private readonly int _size;
        private readonly double[] _weights; 
        
        public WeightedMovingAverageFilter(int windowSize)
        {
            _size = windowSize;
            _weights = new double[_size];

            // compute gaussian weights for windowSize
            Normal.Samples(_weights, 0, 1);
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
                else if(result.Count > index && samples.Count > index)
                {
                    var avg = new Point3(0, 0, 0);
                    
                    for (var j = 0; j < _size; j++)
                    {
                        avg += result[index - j] * (float) _weights[j];
                    }
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