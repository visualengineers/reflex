using System;

namespace ReFlex.Core.Common.Interfaces
{
    /// <summary>
    /// A ordered Quantity of <see cref="T"/>
    /// </summary>
    public interface IDepthImage<T>
    {
        /// <summary>
        /// Indexer to a special value in the collection of <see cref="T"/>
        /// </summary>
        /// <remarks>
        /// Better use <code>AsArray()</code> because it is faster.
        /// </remarks>
        /// <value>
        /// A special <see cref="T"/>.
        /// </value>
        /// <param name="index">Position in the collection of <see cref="T"/></param>
        /// <returns>
        /// A special <see cref="T"/>.
        /// </returns>
        T this[int index] { get; set; }

        /// <summary>
        /// Indexer to a special value in the collection of <see cref="T"/>
        /// </summary>
        /// <remarks>
        /// Better use <code>AsJaggedArray()</code> because it is faster.
        /// </remarks>
        /// <value>
        /// A special <see cref="T"/>.
        /// </value>
        /// <param name="x">Horizontal position in the collection of <see cref="T"/>.</param>
        /// <param name="y">Vertical position in the collection of <see cref="T"/></param>
        /// <returns>A special <see cref="T"/>.</returns>
        T this[int x, int y] { get; set; }

        /// <summary>
        /// Gets the size.
        /// </summary>
        /// <value>
        /// The size.
        /// </value>
        int Size { get; }

        /// <summary>
        /// Gets the horizontal size.
        /// </summary>
        /// <value>
        /// The horizontal size.
        /// </value>
        int SizeX { get; }

        /// <summary>
        /// Gets the vertical size.
        /// </summary>
        /// <value>
        /// The vertical size.
        /// </value>
        int SizeY { get; }

        /// <summary>
        /// Get [this] instance as an array.
        /// </summary>
        /// <returns>[this] instance as an array</returns>
        T[] AsArray();

        /// <summary>
        /// Get [this] instance as an jagged array.
        /// </summary>
        /// <returns>
        /// [this] instance as an jagged array.
        /// </returns>
        T[][] AsJaggedArray();

        /// <summary>
        /// Updates [this] instance with the data of the specified source.
        /// </summary>
        /// <param name="source">The source depth values</param>
        /// <param name="defaultZ">The default z value for invalid points.</param>
        void Update(ReadOnlyMemory<T> source, float defaultZ);
    }
}
