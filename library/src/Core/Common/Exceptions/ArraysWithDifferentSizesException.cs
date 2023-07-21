using System;

namespace ReFlex.Core.Common.Exceptions
{
    /// <inheritdoc />
    /// <summary>
    /// Is thrown if two arrays have different sizes.
    /// </summary>
    /// <seealso cref="Exception" />
    public class ArraysWithDifferentSizesException : Exception
    {
        /// <inheritdoc />
        /// <summary>
        /// Initializes a new instance of the <see cref="ArraysWithDifferentSizesException" /> class.
        /// </summary>
        public ArraysWithDifferentSizesException() { }

        /// <inheritdoc />
        /// <summary>
        /// Initializes a new instance of the <see cref="ArraysWithDifferentSizesException" /> class.
        /// </summary>
        /// <param name="message">The message describing the error.</param>
        public ArraysWithDifferentSizesException(string message) : base(message) { }
    }
}
