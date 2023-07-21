namespace ReFlex.Core.Common.Interfaces
{
    /// <summary>
    /// The base structure for a twodimensional information.
    /// </summary>
    public interface IBase2
    {
        /// <summary>
        /// Gets or sets the x value.
        /// </summary>
        /// <value>
        /// The x value.
        /// </value>
        float X { get; set; }

        /// <summary>
        /// Gets or sets the y value.
        /// </summary>
        /// <value>
        /// The y value.
        /// </value>
        float Y { get; set; }

        /// <summary>
        /// Returns true if this point is valid.
        /// </summary>
        /// <value>
        ///   <c>true</c> if this point is valid; otherwise, <c>false</c>.
        /// </value>
        bool IsValid { get; set; }

        /// <summary>
        /// Sets the x and y value.
        /// </summary>
        /// <param name="x">The x value.</param>
        /// <param name="y">The y value.</param>
        void Set(float x, float y);

        /// <summary>
        /// Copies the values from the input to [this] instance.
        /// </summary>
        /// <param name="base2">Another base2 input.</param>
        void Set(IBase2 base2);

        /// <summary>
        /// Creates a copy of [this].
        /// </summary>
        /// <returns>The copy.</returns>
        IBase2 Copy();

        /// <summary>
        /// Compares [this] instance with the input.
        /// </summary>
        /// <param name="base2">The base2 input to compare with.</param>
        /// <returns>
        /// <c>true</c> if the values of the input and [this] instance are equal.
        /// </returns>
        bool Equals(IBase2 base2);
    }
}
