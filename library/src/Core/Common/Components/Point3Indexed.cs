using System;
using ReFlex.Core.Common.Interfaces;

namespace ReFlex.Core.Common.Components
{
    [Serializable]
    public class Point3Indexed
    {
        /// <inheritdoc />
        /// <summary>
        /// Gets or sets the x value.
        /// </summary>
        /// <value>
        /// The x value.
        /// </value>
        public float X { get; set; }

        /// <inheritdoc />
        /// <summary>
        /// Gets or sets the y value.
        /// </summary>
        /// <value>
        /// The y value.
        /// </value>
        public float Y { get; set; }

        /// <inheritdoc />
        /// <summary>
        /// Gets or sets the z value.
        /// </summary>
        /// <value>
        /// The z value.
        /// </value>
        public float Z { get; set; }
        
        public int Column { get; set; }
        
        public int Row { get; set; }

        /// <summary>
        /// Returns true if ... is valid.
        /// </summary>
        /// <value>
        ///   <c>true</c> if this instance is valid; otherwise, <c>false</c>.
        /// </value>
        public bool IsValid { get; set; } = true;


        /// <summary>
        /// Returns true if the point is excluded by a filter.
        /// </summary>
        /// <value>
        ///   <c>true</c> if this instance is removed by a filtered, otherwise <c>false</c>.
        /// </value>
        public bool IsFiltered { get; set; } = false;
        
        public Point3Indexed(Point3 point, int col, int row)
        {
            X = point.X;
            Y = point.Y;
            Z = point.Z;
            IsValid = point.IsValid;
            IsFiltered = point.IsFiltered;
            Column = col;
            Row = row;
        }
        
    }
}