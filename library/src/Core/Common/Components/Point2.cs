using ReFlex.Core.Common.Interfaces;

namespace ReFlex.Core.Common.Components
{
    /// <summary>
    /// A twodimensional point.
    /// </summary>
    /// <seealso cref="IBase2" />
    /// <inheritdoc />
    /// <seealso cref="T:ReFlex.Core.Common.Interfaces.IBase2" />
    public class Point2 : IBase2
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
        /// Returns true if ... is valid.
        /// </summary>
        /// <value>
        ///   <c>true</c> if this point is valid; otherwise, <c>false</c>.
        /// </value>
        public bool IsValid { get; set; } = true;

        /// <summary>
        /// Initializes a new instance of the <see cref="Point2"/> class.
        /// </summary>
        public Point2() => Set(0, 0);

        /// <summary>
        /// Initializes a new instance of the <see cref="Point2"/> class.
        /// </summary>
        /// <param name="x">The x.</param>
        /// <param name="y">The y.</param>
        public Point2(float x, float y) => Set(x, y);

        /// <summary>
        /// Initializes a new instance of the <see cref="Point2"/> class.
        /// </summary>
        /// <param name="base2">The base2.</param>
        public Point2(IBase2 base2) => Set(base2);

        /// <inheritdoc />
        /// <summary>
        /// Copies the values from the input to [this] instance.
        /// </summary>
        /// <param name="base2">The base2.</param>
        public void Set(IBase2 base2) => Set(base2.X, base2.Y);

        /// <inheritdoc />
        /// <summary>
        /// Creates a copy of [this].
        /// </summary>
        /// <returns></returns>
        public IBase2 Copy() => new Point2(this);

        /// <inheritdoc />
        /// <summary>
        /// Sets the x and y value.
        /// </summary>
        /// <param name="x">The x value.</param>
        /// <param name="y">The y value.</param>
        public void Set(float x, float y)
        {
            X = x;
            Y = y;
        }

        /// <summary>
        /// Direction from start to end.
        /// </summary>
        /// <param name="start">The start.</param>
        /// <param name="end">The end.</param>
        /// <returns>A <see cref="Vector2"/> which points from start to end.</returns>
        public static Vector2 Direction(Point2 start, Point2 end) =>
            new Vector2(end.X - start.X, end.Y - start.Y);

        /// <summary>
        /// Interpolates between point1 and point2.
        /// </summary>
        /// <param name="point1">The point1.</param>
        /// <param name="point2">The point2.</param>
        /// <param name="weight">The weight.</param>
        /// <returns>Interpolated point.</returns>
        public static Point2 Interpolate(Point2 point1, Point2 point2, float weight)
        {
            var x = (1 - weight) * point1.X + weight * point2.X;
            var y = (1 - weight) * point1.Y + weight * point2.Y;
            return new Point2(x, y);
        }

        /// <inheritdoc />
        /// <summary>
        /// Equalses the specified base2.
        /// </summary>
        /// <param name="base2">The base2.</param>
        /// <returns></returns>
        public bool Equals(IBase2 base2) => base2 != null && Equals(X, base2.X) && Equals(Y, base2.Y);

        /// <summary>
        /// Returns a <see cref="string" /> that represents [this] instance.
        /// </summary>
        /// <returns>
        /// A <see cref="string" /> that represents [this] instance.
        /// </returns>
        public override string ToString() => IsValid ? $"X: {X}; Y: {Y}" : "invalid";

    }
}
