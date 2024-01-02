namespace ReFlex.Core.Common.Interfaces
{
    /// <summary>
    /// The base structure for a threedimensional information.
    /// </summary>
    public interface IBase3
    {
        #region properties

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
        /// Gets or sets the z value.
        /// </summary>
        /// <value>
        /// The z value.
        /// </value>
        float Z { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether this instance is enabled.
        /// </summary>
        /// <value>
        ///   <c>true</c> if this instance is enabled; otherwise, <c>false</c>.
        /// </value>
        bool IsValid { get; set; }
        
        /// <summary>
        /// Gets or sets a value indicating whether this instance is filtered / not valid.
        /// </summary>
        /// <value>
        ///   <c>true</c> if this instance is filtered; otherwise, <c>false</c>.
        /// </value>
        bool IsFiltered { get; set; }

        #endregion

        #region methods

        /// <summary>
        /// Sets the x, y and z value.
        /// </summary>
        /// <param name="x">The x value.</param>
        /// <param name="y">The y value.</param>
        /// <param name="z">The z value.</param>
        void Set(float x, float y, float z);

        /// <summary>
        /// Copies the values from the input to [this] instance.
        /// </summary>
        /// <param name="base3">Another base3 input.</param>
        void Set(IBase3 base3);

        /// <summary>
        /// Copies this instance.
        /// </summary>
        /// <returns></returns>
        IBase3 Copy();

        /// <summary>
        /// Compares [this] instance with the input.
        /// </summary>
        /// <param name="base3">The base3 input to compare with.</param>
        /// <returns>
        /// <c>true</c> if the values of the input and [this] instance are equal.
        /// </returns>
        bool Equals(IBase3 base3);

        #endregion
    }
}
