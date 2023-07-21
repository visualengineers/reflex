using System;
using System.Threading.Tasks;
using ReFlex.Core.Common.Interfaces;

namespace ReFlex.Core.Common.Components
{
    /// <inheritdoc />
    /// <summary>
    /// A ordered Quantity of <see cref="Point2"/>
    /// </summary>
    /// <seealso cref="IDepthImage{T}" />
    public class PointCloud2 : IDepthImage<Point2>
    {
        private Point2[] _values1D;
        private Point2[][] _values2D;

        /// <inheritdoc />
        /// <summary>
        /// Gets or sets the <see cref="T:ReFlex.Core.Common.Components.Point2" /> at the specified index.
        /// </summary>
        /// <value>
        /// The <see cref="T:ReFlex.Core.Common.Components.Point2" />.
        /// </value>
        /// <param name="index">The index.</param>
        /// <returns></returns>
        public Point2 this[int index]
        {
            get
            {
                if (index < 0 || index >= Size)
                    return new Point2();
                return _values1D[index] ?? (_values1D[index] = new Point2());
            }
            set => _values1D[index]?.Set(value);
        }

        /// <inheritdoc />
        /// <summary>
        /// Gets or sets the <see cref="Point2" /> with the specified x.
        /// </summary>
        /// <value>
        /// The <see cref="Point2" />.
        /// </value>
        /// <param name="x">The x.</param>
        /// <param name="y">The y.</param>
        /// <returns></returns>
        public Point2 this[int x, int y]
        {
            get => _values2D[x][y] ?? (_values2D[x][y] = new Point2());
            set => _values2D[x][y]?.Set(value);
        }

        /// <inheritdoc />
        /// <summary>
        /// Gets the size.
        /// </summary>
        /// <value>
        /// The size.
        /// </value>
        public int Size { get; private set; }

        /// <inheritdoc />
        /// <summary>
        /// Gets the horizontal size.
        /// </summary>
        /// <value>
        /// The horizontal size.
        /// </value>
        public int SizeX { get; private set; }

        /// <inheritdoc />
        /// <summary>
        /// Gets the vertical size.
        /// </summary>
        /// <value>
        /// The vertical size.
        /// </value>
        public int SizeY { get; private set; }

        /// <inheritdoc />
        /// <summary>
        /// Get [this] instance as an array.
        /// </summary>
        /// <returns>
        /// [this] instance as an array
        /// </returns>
        public Point2[] AsArray() => _values1D;

        /// <inheritdoc />
        /// <summary>
        /// Get [this] instance as an jagged array
        /// </summary>
        /// <returns>
        /// [this] instance as an jagged array
        /// </returns>
        public Point2[][] AsJaggedArray() => _values2D;

        /// <summary>
        /// Initializes a new instance of the <see cref="PointCloud2"/> class.
        /// </summary>
        /// <param name="sizeX">The size x.</param>
        /// <param name="sizeY">The size y.</param>
        public PointCloud2(int sizeX, int sizeY) => Initialize(sizeX, sizeY);

        /// <summary>
        /// Updates [this] instance with the data of the specified source.
        /// </summary>
        /// <param name="source">The source value.</param>
        public void Update(ReadOnlyMemory<Point2> source, float defaultZ)
        {
            Parallel.For(0, source.Length, i =>
                {
                    var val = _values1D[i];
                    _values1D[i].Set(val.IsValid ? source.Span[i] : new Point2(0f,0f));
                }
            );
        }

        /// <summary>
        /// Initializes the specified size y.
        /// </summary>
        /// <param name="sizeX">The size x.</param>
        /// <param name="sizeY">The size y.</param>
        public void Initialize(int sizeX, int sizeY)
        {
            SizeX = sizeX;
            SizeY = sizeY;
            Size = sizeX * sizeY;

            ArrayUtils.InitializeArray(out _values1D, Size);
            ArrayUtils.InitializeArray(out _values2D, SizeX, SizeY);
            ArrayUtils.ReferencingArrays(_values1D, _values2D);
        }
    }
}
