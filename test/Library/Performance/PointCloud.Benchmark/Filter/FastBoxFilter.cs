using PointCloud.Benchmark.Common;

namespace PointCloud.Benchmark.Filter;

/// <summary>
/// A two-dimensional box-blur with separated kernels
/// </summary>
public class FastBoxFilter
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
    public FastBoxFilter(int radius) => SetRadius(radius);

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

        if (_radius % 2 == 0)
            _radius++;

        var Avg = 1f / _radius;

        for (int j = 0; j < height; j++)
        {
            var hSum = 0f;
            var iAvg = 0f;

            for (int x = 0; x < _radius; x++)
            {
                hSum += targetRef[x][j].Z;
            }

            iAvg = hSum * Avg;

            for (var i = 0; i < width; i++)
            {
                if (i - _radius / 2 >= 0 && i + 1 + _radius / 2 < width)
                {
                    hSum -= targetRef[i - _radius / 2][j].Z;

                    var tmp = targetRef[i + 1 + _radius / 2][j].Z;
                    hSum += tmp;

                    iAvg = hSum * Avg;
                }

                targetRef[i][j].Z = iAvg;
            }
        }

        // need copy ?
        // Bitmap total = Hblur.Clone();

        for (var i = 0; i < width; i++)
        {
            var tSum = 0f;
            var iAvg = 0f;
            for (int y = 0; y < _radius; y++)
            {
                var tmpColor = targetRef[i][y].Z;
                tSum += tmpColor;
            }

            iAvg = tSum * Avg;

            for (int j = 0; j < height; j++)
            {
                if (j - _radius / 2 >= 0 && j + 1 + _radius / 2 < height)
                {
                    var tmp_pColor = targetRef[i][j - _radius / 2].Z;
                    tSum -= tmp_pColor;

                    var tmp_nColor = targetRef[i][j + 1 + _radius / 2].Z;
                    tSum += tmp_nColor;
                    //
                    iAvg = tSum * Avg;
                }

                targetRef[i][j].Z = iAvg;
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