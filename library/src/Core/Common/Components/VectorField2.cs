using System;
using System.Threading.Tasks;
using ReFlex.Core.Common.Interfaces;

namespace ReFlex.Core.Common.Components
{
  /// <inheritdoc />
  /// <summary>
  /// A ordered Quantity of <see cref="Vector2" />
  /// </summary>
  public class VectorField2 : IDepthImage<Vector2>
  {
    private static readonly float _interpolationStrength = 0.7f;

    private bool _hasProcessedValues = false;

    private Vector2[][] _values2D;
    private Vector2[] _values1D;
    private Vector2[,] _lastProcessedValues;

    /// <inheritdoc />
    /// <summary>
    /// Gets or sets the <see cref="Vector2" /> at the specified index.
    /// </summary>
    /// <value>
    /// The <see cref="Vector2" />.
    /// </value>
    /// <param name="index">The index.</param>
    /// <returns></returns>
    public Vector2 this[int index]
    {
      get
      {
        if (index < 0 || index >= Size)
          return new Vector2();
        return _values1D[index] ?? (_values1D[index] = new Vector2());
      }
      set => _values1D[index]?.Set(value);
    }

    /// <inheritdoc />
    /// <summary>
    /// Gets or sets the <see cref="Vector2" /> with the specified x.
    /// </summary>
    /// <value>
    /// The <see cref="Vector2" />.
    /// </value>
    /// <param name="x">The x.</param>
    /// <param name="y">The y.</param>
    /// <returns></returns>
    public Vector2 this[int x, int y]
    {
      get => _values2D[x][y] ?? (_values2D[x][y] = new Vector2());
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

    /// <summary>
    /// Gets the stride.
    /// </summary>
    /// <value>
    /// The stride.
    /// </value>
    public int Stride { get; }

    /// <inheritdoc />
    /// <summary>
    /// Get [this] instance as an array.
    /// </summary>
    /// <returns>
    /// [this] instance as an array
    /// </returns>
    public Vector2[] AsArray() => _values1D;

    /// <inheritdoc />
    /// <summary>
    /// Get [this] instance as an jagged array
    /// </summary>
    /// <returns>
    /// [this] instance as an jagged array
    /// </returns>
    public Vector2[][] AsJaggedArray() => _values2D;

    /// <summary>
    /// Initializes a new instance of the <see cref="VectorField2" /> class.
    /// </summary>
    /// <param name="sizeX">The size x.</param>
    /// <param name="sizeY">The size y.</param>
    /// <param name="stride">The stride.</param>
    public VectorField2(int sizeX, int sizeY, int stride = 1)
    {
      Initialize(sizeX, sizeY);
      Stride = stride > 0 ? stride : 1;
    }

    /// <inheritdoc />
    /// <summary>
    /// Updates [this] instance with the data of the specified source.
    /// </summary>
    /// <param name="source">The source value.</param>
    public void Update(ReadOnlyMemory<Vector2> source, float defualtZ)
    {
      Parallel.For(0, source.Length, i =>
          {
            _values1D[i].Set(source.Span[i]);
          }
      );
    }

    /// <summary>
    /// Populates the vectorfield.
    /// </summary>
    /// <param name="source">The source.</param>
    public void Populate(PointCloud3 source)
    {
      var pointcloud = source.AsJaggedArray();

      for (var y = Stride; y < SizeY - Stride; ++y)
      {
        for (var x = Stride; x < SizeX - Stride; ++x)
        {
          if (!pointcloud[x][y].IsValid)
          {
            _values2D[x][y].IsValid = false;
            _values2D[x][y].Set(0, 0);
            continue;
          }
          else
            _values2D[x][y].IsValid = true;

          var x1 = pointcloud[x - Stride][y];
          var x2 = pointcloud[x + Stride][y];
          var y1 = pointcloud[x][y - Stride];
          var y2 = pointcloud[x][y + Stride];

          var deltaX = x1.Z - x2.Z;
          var deltaY = y1.Z - y2.Z;

          var dX = x2.X - x1.X;
          var dY = y2.Y - y1.Y;

          deltaX /= dX;
          deltaY /= dY;

          if (!_hasProcessedValues)
          {
            _values2D[x][y].Set(deltaX, deltaY);
          }
          else
          {
            var exisitingValue = _lastProcessedValues[x, y];
            var interpolatedX = deltaX * _interpolationStrength + (1f - _interpolationStrength) * exisitingValue.X;
            var interpolatedY = deltaY * _interpolationStrength + (1f - _interpolationStrength) * exisitingValue.Y;
            _values2D[x][y].Set(interpolatedX, interpolatedY);
            _lastProcessedValues[x, y].Set(interpolatedX, interpolatedY);
          }
        }
      }

      _hasProcessedValues = true;
    }

    /// <summary>
    /// Initializes the specified size y.
    /// </summary>
    /// <param name="sizeX">The size x.</param>
    /// <param name="sizeY">The size y.</param>
    private void Initialize(int sizeX, int sizeY)
    {
      SizeX = sizeX;
      SizeY = sizeY;
      Size = sizeX * sizeY;

      ArrayUtils.InitializeArray(out _values1D, Size);
      ArrayUtils.InitializeArray(out _values2D, SizeX, SizeY);
      ArrayUtils.ReferencingArrays(_values1D, _values2D);

      ArrayUtils.InitializeArray(out _lastProcessedValues, SizeX, SizeY);
      _hasProcessedValues = false;
    }
  }
}
