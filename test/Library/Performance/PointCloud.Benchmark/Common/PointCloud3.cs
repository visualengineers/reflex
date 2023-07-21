using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Interfaces;

namespace PointCloud.Benchmark.Common
{
    /// <summary>
    /// A ordered Quantity of <see cref="Point3" />
    /// </summary>
    /// <seealso cref="IPointCloud{Point3}" />
    /// <inheritdoc />
    public class PointCloud3 : IDepthImage<Point3>
    {
        #region fields

        private Point3[] _values1D;
        private Point3[][] _values2D;

        #endregion

        #region indexer

        /// <summary>
        /// Gets or sets the <see cref="Point3" /> at the specified index.
        /// </summary>
        /// <value>
        /// The <see cref="Point3" />.
        /// </value>
        /// <param name="index">The index.</param>
        /// <returns></returns>
        /// <inheritdoc />
        public Point3 this[int index]
        {
            get
            {
                if(index < 0 || index >= Size)
                    return new Point3();
                return _values1D[index] ?? (_values1D[index] = new Point3());
            }
            set => _values1D[index]?.Set(value);
        }

        /// <summary>
        /// Gets or sets the <see cref="Point3" /> with the specified x.
        /// </summary>
        /// <value>
        /// The <see cref="Point3" />.
        /// </value>
        /// <param name="x">The x.</param>
        /// <param name="y">The y.</param>
        /// <returns></returns>
        /// <inheritdoc />
        public Point3 this[int x, int y]
        {
            get => _values2D[x][y] ?? (_values2D[x][y] = new Point3());
            set => _values2D[x][y]?.Set(value);
        }

        #endregion

        #region properties

        /// <summary>
        /// Gets the size.
        /// </summary>
        /// <value>
        /// The size.
        /// </value>
        /// <inheritdoc />
        public int Size { get; private set; }

        /// <summary>
        /// Gets the horizontal size.
        /// </summary>
        /// <value>
        /// The horizontal size.
        /// </value>
        /// <inheritdoc />
        public int SizeX { get; private set; }

        /// <summary>
        /// Gets the vertical size.
        /// </summary>
        /// <value>
        /// The vertical size.
        /// </value>
        /// <inheritdoc />
        public int SizeY { get; private set; }

        #endregion

        #region constructor

        /// <summary>
        /// Initializes a new instance of the <see cref="PointCloud3" /> class.
        /// </summary>
        /// <param name="sizeX">The size x.</param>
        /// <param name="sizeY">The size y.</param>
        public PointCloud3(int sizeX, int sizeY) => Initialize(sizeX, sizeY);

        #endregion

        #region methods

        /// <summary>
        /// Updates [this] instance with the data of the specified source.
        /// </summary>
        /// <param name="source">The source value.</param>
        /// <inheritdoc />
        public void Update(Point3[] source)
        {
            for (var i = 0; i < source.Length; ++i) {
                _values1D[i].Set(source[i]);
            }
        }
        
        /// <summary>
        /// Updates [this] instance with the data of the specified source.
        /// </summary>
        /// <param name="source">The source value.</param>
        /// <inheritdoc />
        public void Update(ReadOnlySpan<Point3> source)
        {
            for (var i = 0; i < source.Length; ++i) {
                _values1D[i].Set(source[i]);
            }
        }
        
        /// <summary>
        /// Updates [this] instance with the data of the specified source.
        /// </summary>
        /// <param name="source">The source value.</param>
        /// <inheritdoc />
        public void Update2(ReadOnlySpan<Point3> source)
        {
            var valSpan = _values1D.AsSpan();
            
            for (var i = 0; i < source.Length; ++i) {
                valSpan[i].Set(source[i]);
            }
        }
        
        /// <summary>
        /// Updates [this] instance with the data of the specified source.
        /// </summary>
        /// <param name="source">The source value.</param>
        /// <inheritdoc />
        public void UpdateParallel(ReadOnlyMemory<Point3> source)
        {
            Parallel.For(0, source.Length, i =>
                // for (var i = 0; i < source.Length; ++i)
                {
                    _values1D[i].Set(source.Span[i]);
                }
            );
        }
        
        /// <summary>
        /// Updates [this] instance with the data of the specified source.
        /// </summary>
        /// <param name="source">The source value.</param>
        /// <inheritdoc />
        public void Update(ReadOnlyMemory<Point3> source)
        {
            for (var i = 0; i < source.Length; ++i)
            {
                _values1D[i].Set(source.Span[i]);
            }

        }
        
        /// <summary>
        /// Updates [this] instance with the data of the specified source.
        /// </summary>
        /// <param name="source">The source value.</param>
        /// <inheritdoc />
        [Obsolete("Benchmark showed that this is 3 times slower than Update() method")]
        public void UpdateParallel(Point3[] source)
        {
            Parallel.For(0, source.Length, (i) =>
            {
                _values1D[i].Set(source[i]);
            });

            Array.Copy(source, _values1D, source.Length);
            ArrayUtils.ReferencingArrays(_values1D, _values2D);

            // for (int i = 0; i < source.Length; ++i) {
            //     _values1D[i].Set(source[i]);
            // }
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
            ArrayUtils.InitializeArray(out _values2D, SizeX, sizeY);
            ArrayUtils.ReferencingArrays(_values1D, _values2D);
        }

        public Point3[] AsArray() => _values1D;
        
        public Span<Point3> AsSpan() => _values1D.AsSpan();
        
        public Memory<Point3> AsMemory() => _values1D.AsMemory();

        public Point3[][] AsJaggedArray() => _values2D;
        public void Update(ReadOnlyMemory<Point3> source, float defaultZ)
        {
            Update(source);
        }

        #endregion
    }
}
