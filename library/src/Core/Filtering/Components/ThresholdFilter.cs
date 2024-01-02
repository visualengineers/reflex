using System;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Exceptions;

namespace ReFlex.Core.Filtering.Components
{
    /// <summary>
    /// Filters values which inner z-values are greater than a specified threshold.
    /// </summary>
    public class ThresholdFilter
    {
        #region properties

        /// <summary>
        /// Gets or sets the threshold.
        /// </summary>
        /// <value>
        /// The threshold.
        /// </value>
        public float Threshold { get; set; }

        #endregion

        #region constructor

        /// <summary>
        /// Initializes a new instance of the <see cref="ThresholdFilter" /> class.
        /// </summary>
        /// <param name="threshold">The threshold.</param>
        public ThresholdFilter(float threshold) => Threshold = threshold;

        #endregion

        #region methods

        /// <summary>
        /// Filters this instance.
        /// </summary>
        /// <param name="source">The source.</param>
        /// <param name="target">The target.</param>
        /// <exception cref="NullReferenceException"></exception>
        /// <exception cref="ArraysWithDifferentSizesException"></exception>
        public void Filter(Point3[] source, PointCloud3 target)
        {
            if (source == null || target == null)
                throw new NullReferenceException();

            var targetRef = target.AsArray();

            if (source.Length != targetRef.Length)
                throw new ArraysWithDifferentSizesException();

            for (var i = 0; i <  source.Length; ++i)
            {
                if (!targetRef[i].IsValid)
                    continue;

                if (IsOutlier(source[i], targetRef[i]))
                    source[i].Set(targetRef[i]);
            }
        }

        /// <summary>
        /// Determines whether the specified source is outlier.
        /// </summary>
        /// <param name="source">The source.</param>
        /// <param name="target">The target.</param>
        /// <returns>
        ///   <c>true</c> if the specified source is outlier; otherwise, <c>false</c>.
        /// </returns>
        public bool IsOutlier(Point3 source, Point3 target) => System.Math.Abs(target.Z - source.Z) >= Threshold;

        #endregion
    }
}
