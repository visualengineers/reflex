using System;
using ReFlex.Core.Common.Interfaces;

namespace ReFlex.Core.Common.Components
{
    /// <inheritdoc />
    /// <summary>
    /// A three dimensional point.
    /// @todo: checks and fallback values for null references for operators and methods
    /// </summary>
    /// <seealso cref="IBase3" />
    public class Point3 : IBase3
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

        /// <summary>
        /// Initializes a new instance of the <see cref="Point3"/> class.
        /// </summary>
        public Point3() => Set(0, 0, 0);

        /// <summary>
        /// Initializes a new instance of the <see cref="Point3"/> class.
        /// </summary>
        /// <param name="x">The x.</param>
        /// <param name="y">The y.</param>
        /// <param name="z">The z.</param>
        public Point3(float x, float y, float z) => Set(x, y, z);

        /// <summary>
        /// Initializes a new instance of the <see cref="Point3"/> class.
        /// </summary>
        /// <param name="base3">The base3.</param>
        public Point3(IBase3 base3) => Set(base3);

        /// <inheritdoc />
        /// <summary>
        /// Copies the values from the input to [this] instance.
        /// </summary>
        /// <param name="base3">The base3 input.</param>
        public void Set(IBase3 base3) => Set(base3.X, base3.Y, base3.Z);

        /// <inheritdoc />
        /// <summary>
        /// Copies this instance.
        /// </summary>
        /// <returns>a copy of this instance</returns>
        public IBase3 Copy() => new Point3(this) { IsValid = IsValid, IsFiltered = IsFiltered };

        /// <inheritdoc />
        /// <summary>
        /// Sets the x, y and z value.
        /// </summary>
        /// <param name="x">The x value.</param>
        /// <param name="y">The y value.</param>
        /// <param name="z">The z value.</param>
        public void Set(float x, float y, float z)
        {
            X = x;
            Y = y;
            Z = z;
        }

        /// <summary>
        /// Direction from start to end.
        /// </summary>
        /// <param name="start">The start.</param>
        /// <param name="end">The end.</param>
        /// <returns>A <see cref="Vector3"/> which points from start to end.</returns>
        public static Vector3 Direction(Point3 start, Point3 end) =>
            new Vector3(end.X - start.X, end.Y - start.Y, end.Z - start.Z);

        /// <summary>
        /// Interpolates between point1 and point2.
        /// </summary>
        /// <param name="point1">The point1.</param>
        /// <param name="point2">The point2.</param>
        /// <param name="weight">The weight.</param>
        /// <returns>Interpolated point.</returns>
        public static Point3 Interpolate(Point3 point1, Point3 point2, float weight)
        {
            var x = (1 - weight) * point1.X + weight * point2.X;
            var y = (1 - weight) * point1.Y + weight * point2.Y;
            var z = (1 - weight) * point1.Z + weight * point2.Z;
            return new Point3(x, y, z);
        }

        public static Point3 operator +(Point3 a, Point3 b)
        {
            return new Point3(a.X + b.X, a.Y + b.Y, a.Z + b.Z);
        }
        
        public static Point3 operator -(Point3 a, Point3 b)
        {
            return new Point3(a.X - b.X, a.Y - b.Y, a.Z - b.Z);
        }

        public static Point3 operator *(Point3 a, float scalar)
        {
            return new Point3(a.X * scalar, a.Y * scalar, a.Z * scalar);
        }
        
        public static Point3 operator /(Point3 a, float scalar)
        {
            if (System.Math.Abs(scalar) <= float.Epsilon)
                scalar = scalar >= 0 ? float.Epsilon : -float.Epsilon;
                
            var rez = 1f / scalar;
            return new Point3(a.X * rez, a.Y * rez, a.Z * rez);
        }

        /// <summary>
        /// Calculates the distance between two points.
        /// </summary>
        /// <param name="point1">The point1.</param>
        /// <param name="point2">The point2.</param>
        /// <returns>The distance between two points.</returns>
        public static float Distance(Point3 point1, Point3 point2)
        {
            var lenX = point2.X - point1.X;
            var lenY = point2.Y - point1.Y;
            var lenZ = point2.Z - point1.Z;

            return (float)System.Math.Sqrt((lenX * lenX) + (lenY * lenY) + (lenZ * lenZ));
        }

        public static float Squared2DDistance(Point3 point1, Point3 point2)
        {
            var lenX = point2.X - point1.X;
            var lenY = point2.Y - point1.Y;

            return System.Math.Abs(lenX) + System.Math.Abs(lenY);
        }

        /// <summary>
        /// Compares [this] instance with the input.
        /// </summary>
        /// <param name="base3">The base3 to compare with.</param>
        /// <returns>
        ///   <c>true</c> if the values of the input and [this] instance are equal.
        /// </returns>
        public bool Equals(IBase3 base3)
        {
            return base3 != null &&
                   Equals(X, base3.X) &&
                   Equals(Y, base3.Y) &&
                   Equals(Z, base3.Z);
        }

        /// <summary>
        /// Returns a <see cref="string" /> that represents [this] instance.
        /// </summary>
        /// <returns>
        /// A <see cref="string" /> that represents [this] instance.
        /// </returns>
        public override string ToString() => IsValid ? $"X: {X}; Y: {Y}; Z: {Z}" : "invalid";
    }
}
