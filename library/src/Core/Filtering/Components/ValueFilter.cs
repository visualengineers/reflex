using System;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Exceptions;

namespace ReFlex.Core.Filtering.Components
{
    /// <summary>
    /// Filters values which inner values equals specified values.
    /// </summary>
    public class ValueFilter
    {
        #region properties

        /// <summary>
        /// Gets or sets the x value.
        /// </summary>
        /// <value>
        /// The x.
        /// </value>
        public float? X { get; set; }

        /// <summary>
        /// Gets or sets the y value.
        /// </summary>
        /// <value>
        /// The y.
        /// </value>
        public float? Y { get; set; }

        /// <summary>
        /// Gets or sets the z value.
        /// </summary>
        /// <value>
        /// The z.
        /// </value>
        public float? Z { get; set; }

        #endregion

        #region constructor

        /// <summary>
        /// Initializes a new instance of the <see cref="ValueFilter"/> class.
        /// </summary>
        /// <param name="x">The x.</param>
        /// <param name="y">The y.</param>
        /// <param name="z">The z.</param>
        public ValueFilter(float? x = null, float? y = null, float? z = null)
        {
            X = x;
            Y = y;
            Z = z;
        }

        #endregion

        #region methods

        /// <summary>
        /// Filters the specified source.
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

            if (source.Length != target.Size)
                throw new ArraysWithDifferentSizesException();

            for (var i = 0; i < source.Length; ++i)
            {
                if (!targetRef[i].IsValid)
                    continue;

                if (IsOutlier(source[i]))
                    source[i].Set(targetRef[i]);
            }
        }

        /// <summary>
        /// Determines whether the specified source is outlier.
        /// </summary>
        /// <param name="source">The source.</param>
        /// <returns>
        ///   <c>true</c> if the specified source is outlier; otherwise, <c>false</c>.
        /// </returns>
        public bool IsOutlier(Point3 source)
        {
            var result = true;

            if (source == null)
                return true;

            if (X != null)
                result &= X == source.X;
            if (Y != null)
                result &= Y == source.Y;
            if (Z != null)
                result &= Z == source.Z;

            return result;
        }

        #endregion
    }
}
