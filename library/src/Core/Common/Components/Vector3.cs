using System;
using ReFlex.Core.Common.Interfaces;

namespace ReFlex.Core.Common.Components
{
    /// <inheritdoc />
    /// <summary>
    /// A threedimensional vector.
    /// </summary>
    /// <seealso cref="IBase3" />
    public class Vector3 : IBase3
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
        /// Returns true if the vector is valid.
        /// </summary>
        /// <value>
        ///   <c>true</c> if this vector is valid; otherwise, <c>false</c>.
        /// </value>
        /// <inheritdoc />
        public bool IsValid { get; set; } = true;

        /// <summary>
        /// Returns true if this vector is filtered.
        /// </summary>
        /// <value>
        ///   <c>true</c> if this vector is filtered; otherwise, <c>false</c>.
        /// </value>
        /// <inheritdoc />
        public bool IsFiltered { get; set; } = true;

        
        /// <summary>
        /// Initializes a new instance of the <see cref="Vector3"/> class.
        /// </summary>
        public Vector3() => Set(0, 0, 0);

        /// <summary>
        /// Initializes a new instance of the <see cref="Vector3"/> class.
        /// </summary>
        /// <param name="x">The x.</param>
        /// <param name="y">The y.</param>
        /// <param name="z">The z.</param>
        public Vector3(float x, float y, float z) => Set(x, y, z);

        /// <summary>
        /// Initializes a new instance of the <see cref="Vector3"/> class.
        /// </summary>
        /// <param name="base3">The base3.</param>
        public Vector3(IBase3 base3) => Set(base3);

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
        /// <returns></returns>
        public IBase3 Copy() => new Vector3(this);

        /// <summary>
        /// Gets the length.
        /// </summary>
        /// <value>
        /// The length.
        /// </value>
        public float Length => (float)System.Math.Sqrt(X * X + Y * Y + Z * Z);

        /// <summary>
        /// Gets the normalized copy.
        /// </summary>
        /// <value>
        /// The normalized copy.
        /// </value>
        public Vector3 NormalizedCopy => Length > 0 ? new Vector3(X / Length, Y / Length, Z / Length) : new Vector3();

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

        /// <inheritdoc />
        /// <summary>
        /// Compares [this] instance with the input.
        /// </summary>
        /// <param name="base3">The base3 to compare with.</param>
        /// <returns>
        /// <c>true</c> if the values of the input and [this] instance are equal.
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
