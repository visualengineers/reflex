using System;
using ReFlex.Core.Common.Interfaces;

namespace ReFlex.Core.Common.Components
{
    /// <inheritdoc />
    /// <summary>
    /// A twodimensional vector.
    /// </summary>
    /// <seealso cref="IBase2" />
    public class Vector2 : IBase2
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
        /// Initializes a new instance of the <see cref="Vector2"/> class.
        /// </summary>
        public Vector2() => Set(0, 0);

        /// <summary>
        /// Initializes a new instance of the <see cref="Vector2"/> class.
        /// </summary>
        /// <param name="x">The x.</param>
        /// <param name="y">The y.</param>
        public Vector2(float x, float y) => Set(x, y);

        /// <summary>
        /// Initializes a new instance of the <see cref="Vector2"/> class.
        /// </summary>
        /// <param name="base2">The base2.</param>
        public Vector2(IBase2 base2) => Set(base2);

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
        public IBase2 Copy() => new Vector2(this);

        /// <summary>
        /// Gets the length.
        /// </summary>
        /// <value>
        /// The length.
        /// </value>
        public float Length => (float)System.Math.Sqrt(X * X + Y * Y);

        /// <summary>
        /// Gets the normalized copy.
        /// </summary>
        /// <value>
        /// The normalized copy.
        /// </value>
        public Vector2 NormalizedCopy => Length > 0 ? new Vector2(X / Length, Y / Length) : new Vector2();

        /// <summary>
        /// Adds the specified vector.
        /// </summary>
        /// <param name="vector">The vector.</param>
        /// <returns></returns>
        public Vector2 Add(Vector2 vector) => new Vector2(X + vector.X, Y + vector.Y);

        /// <summary>
        /// Multiplies this vector with the specified vector.
        /// </summary>
        /// <param name="vector">The vector.</param>
        /// <returns></returns>
        public float Multiply(Vector2 vector) => X * vector.X + Y * vector.Y;

        /// <summary>
        /// Multiplies the specified value to this vector.
        /// </summary>
        /// <param name="value">The value.</param>
        public Vector2 Multiply(float value)
        {
            X *= value;
            Y *= value;
            return this;
        }

        /// <summary>
        /// Calculates the angle between this vector and a specified vector.
        /// </summary>
        /// <param name="vector">The vector.</param>
        /// <returns></returns>
        public float AngleBetween(Vector2 vector) => Multiply(vector) / (Length * vector.Length);

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
