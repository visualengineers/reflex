using PointCloud.Benchmark.Common;

namespace PointCloud.Benchmark.Filter;

/// <summary>
/// A two-dimensional box-blur with separated kernels
/// </summary>
public class BoxFilter
{
    #region fields

    private int _radius, _diameter, _width;

    #endregion

    #region properties

    /// <summary>
    /// Gets or sets the radius.
    /// </summary>
    /// <value>
    /// The radius.
    /// </value>
    public int Radius
    {
        get => _radius;
        set => SetRadius(value);
    }

    public float DefaultValue { get; set; }

    #endregion

    #region constructor

    /// <summary>
    /// Initializes a new instance of the <see cref="BoxFilter"/> class.
    /// </summary>
    /// <param name="radius">The radius.</param>
    public BoxFilter(int radius) => SetRadius(radius);

    #endregion

    #region methods

    /// <summary>
    /// Filters highly frequented changes in a field of <see cref="ReFlex.Core.Common.Components.Point3"/>.
    /// </summary>
    public void Filter(PointCloud3 target)
    {
        var targetRef = target.AsJaggedArray();
        var width = target.SizeX;
        var height = target.SizeY;

        // x direction
        for (var y = 0; y < height; ++y)
        {
            var start = targetRef[0][y];
            var sum = DefaultValue * _diameter;

            for (var x = 0; x < width; x++)
            {
                var nrad = x - _radius - 1;
                var prad = x + _radius;

                var sub = nrad >= 0 ? targetRef[nrad][y] : start;
                var add = prad < width ? targetRef[prad][y] : targetRef[width - 1][y];

                sum -= sub.IsValid ? sub.Z : DefaultValue;
                sum += add.IsValid ? add.Z : DefaultValue;

                targetRef[x][y].Z = sum / _diameter;
            }
        }

        // y direction
        for (var x = 0; x < width; ++x)
        {
            var start = targetRef[x][0];
            var sum = DefaultValue * _diameter;

            for (var y = 0; y < height; y++)
            {
                var nrad = y - _radius - 1;
                var prad = y + _radius;

                var sub = nrad >= 0 ? targetRef[x][nrad] : start;
                var add = prad < height ? targetRef[x][prad] : targetRef[x][height - 1];

                sum -= sub.IsValid ? sub.Z : DefaultValue;
                sum += add.IsValid ? add.Z : DefaultValue;

                targetRef[x][y].Z = sum / _diameter;
            }
        }
    }

    /// <summary>
    /// Filters highly frequented changes in a field of <see cref="ReFlex.Core.Common.Components.Point3"/>.
    /// </summary>
    public void FilterOptimized(PointCloud3 target)
    {
        var targetRef = target.AsSpan();
        _width = target.SizeX;
        var height = target.SizeY;

        // x direction
        for (var y = 0; y < height; ++y)
        {
            var start = targetRef[ComputeIndex(0, y)];
            var sum = DefaultValue * _diameter;

            for (var x = 0; x < _width; x++)
            {
                var nrad = x - _radius - 1;
                var prad = x + _radius;

                var sub = nrad >= 0 ? targetRef[ComputeIndex(nrad, y)] : start;
                var add = prad < _width ? targetRef[ComputeIndex(prad, y)] : targetRef[ComputeIndex(_width - 1, y)];

                sum -= sub.IsValid ? sub.Z : DefaultValue;
                sum += add.IsValid ? add.Z : DefaultValue;

                targetRef[ComputeIndex(x, y)].Z = sum / _diameter;
            }
        }

        // y direction
        for (var x = 0; x < _width; ++x)
        {
            var start = targetRef[ComputeIndex(x, 0)];
            var sum = DefaultValue * _diameter;

            for (var y = 0; y < height; y++)
            {
                var nrad = y - _radius - 1;
                var prad = y + _radius;

                var sub = nrad >= 0 ? targetRef[ComputeIndex(x, nrad)] : start;
                var add = prad < height ? targetRef[ComputeIndex(x, prad)] : targetRef[ComputeIndex(x, height - 1)];

                sum -= sub.IsValid ? sub.Z : DefaultValue;
                sum += add.IsValid ? add.Z : DefaultValue;

                targetRef[ComputeIndex(x, y)].Z = sum / _diameter;
            }
        }
    }

    /// <summary>
    /// Filters highly frequented changes in a field of <see cref="ReFlex.Core.Common.Components.Point3"/>.
    /// </summary>
    public void FilterOptimized2(PointCloud3 target)
    {
        var targetRef = target.AsArray().AsSpan();
        _width = target.SizeX;
        var height = target.SizeY;

        // x direction
        for (var y = 0; y < height; ++y)
        {
            var start = targetRef[ComputeIndex(0, y)];
            var sum = DefaultValue * _diameter;

            for (var x = 0; x < _width; x++)
            {
                var nrad = x - _radius - 1;
                var prad = x + _radius;

                var sub = nrad >= 0 ? targetRef[ComputeIndex(nrad, y)] : start;
                var add = prad < _width ? targetRef[ComputeIndex(prad, y)] : targetRef[ComputeIndex(_width - 1, y)];

                sum -= sub.IsValid ? sub.Z : DefaultValue;
                sum += add.IsValid ? add.Z : DefaultValue;

                targetRef[ComputeIndex(x, y)].Z = sum / _diameter;
            }
        }

        // y direction
        for (var x = 0; x < _width; ++x)
        {
            var start = targetRef[ComputeIndex(x, 0)];
            var sum = DefaultValue * _diameter;

            for (var y = 0; y < height; y++)
            {
                var nrad = y - _radius - 1;
                var prad = y + _radius;

                var sub = nrad >= 0 ? targetRef[ComputeIndex(x, nrad)] : start;
                var add = prad < height ? targetRef[ComputeIndex(x, prad)] : targetRef[ComputeIndex(x, height - 1)];

                sum -= sub.IsValid ? sub.Z : DefaultValue;
                sum += add.IsValid ? add.Z : DefaultValue;

                targetRef[ComputeIndex(x, y)].Z = sum / _diameter;
            }
        }
    }

    /// <summary>
    /// Filters highly frequented changes in a field of <see cref="ReFlex.Core.Common.Components.Point3"/>.
    /// </summary>
    public void FilterOptimized3(PointCloud3 target)
    {
        var targetRef = target.AsArray();
        _width = target.SizeX;
        var height = target.SizeY;

        // x direction
        for (var y = 0; y < height; ++y)
        {
            var start = targetRef[ComputeIndex(0, y)];
            var sum = DefaultValue * _diameter;

            for (var x = 0; x < _width; x++)
            {
                var nrad = x - _radius - 1;
                var prad = x + _radius;

                var sub = nrad >= 0 ? targetRef[ComputeIndex(nrad, y)] : start;
                var add = prad < _width ? targetRef[ComputeIndex(prad, y)] : targetRef[ComputeIndex(_width - 1, y)];

                sum -= sub.IsValid ? sub.Z : DefaultValue;
                sum += add.IsValid ? add.Z : DefaultValue;

                targetRef[ComputeIndex(x, y)].Z = sum / _diameter;
            }
        }

        // y direction
        for (var x = 0; x < _width; ++x)
        {
            var start = targetRef[ComputeIndex(x, 0)];
            var sum = DefaultValue * _diameter;

            for (var y = 0; y < height; y++)
            {
                var nrad = y - _radius - 1;
                var prad = y + _radius;

                var sub = nrad >= 0 ? targetRef[ComputeIndex(x, nrad)] : start;
                var add = prad < height ? targetRef[ComputeIndex(x, prad)] : targetRef[ComputeIndex(x, height - 1)];

                sum -= sub.IsValid ? sub.Z : DefaultValue;
                sum += add.IsValid ? add.Z : DefaultValue;

                targetRef[ComputeIndex(x, y)].Z = sum / _diameter;
            }
        }
    }


    /// <summary>
    /// Sets the radius and calculates the diameter.
    /// </summary>
    /// <param name="radius">The radius.</param>
    private void SetRadius(int radius)
    {
        _radius = radius;
        _diameter = radius * 2 + 1;
    }

    private int ComputeIndex(int x, int y)
    {
        return x * _width + y;
    }

    #endregion
}