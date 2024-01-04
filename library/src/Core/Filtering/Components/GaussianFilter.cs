using ReFlex.Core.Common.Components;
using Math = System.Math;

namespace ReFlex.Core.Filtering.Components
{
    /// <summary>
    /// A twodimensianal gaussian blur with separated kernel
    /// </summary>
    public class GaussianBlur
    {
        private readonly int _radius;
        private readonly float[] _distribution;

        /// <summary>
        /// Initializes a new instance of the <see cref="GaussianBlur" /> class.
        /// </summary>
        /// <param name="radius">The radius.</param>
        /// <param name="weight">The weight.</param>
        public GaussianBlur(int radius, float weight)
        {
            _radius = radius;
            _distribution = GetNormalDistribution(_radius, weight);
        }

        /// <summary>
        /// Filters this instance.
        /// </summary>
        public void Filter(PointCloud3 target)
        {
            var targetRef = target.AsJaggedArray();
            var width = target.SizeX;
            var height = target.SizeY;

            // X Richtung
            for (var y = _radius; y < height - _radius; ++y)
            {
                for (var x = _radius; x < width - _radius; x++)
                {
                    var current = targetRef[x][y];

                    float sum = 0;

                    for (var k = -_radius; k < _radius; k++)
                        sum += targetRef[k + x][y].Z * _distribution[k + _radius];

                    current.Z = sum;
                }
            }

            // Y Richtung
            for (var x =_radius; x < width - _radius; ++x)
            {
                for (var y = _radius; y < height - _radius; y++)
                {
                    var current = targetRef[x][y];

                    float sum = 0;

                    for (var k = -_radius; k < _radius; k++)
                        sum += targetRef[x][k + y].Z * _distribution[k + _radius];

                    current.Z = sum;
                }
            }

        }

        /// <summary>
        /// Gets the normal distribution.
        /// </summary>
        /// <param name="radius">The radius.</param>
        /// <param name="weight">The weight.</param>
        /// <returns></returns>
        public static float[] GetNormalDistribution(int radius, float weight)
        {
            var size = radius * 2 + 1;
            var distribution = new float[size];

            for (var i = 0; i < size; i++)
                distribution[i] = (float)(1 / (Math.Sqrt(2 * Math.PI) * weight) * Math.Exp(-(i - radius) * (i - radius) / (2 * weight * weight)));

            return distribution;
        }
    }
}
