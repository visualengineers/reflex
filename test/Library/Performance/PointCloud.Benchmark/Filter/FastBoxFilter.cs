using PointCloud.Benchmark.Common;

namespace PointCloud.Benchmark.Filter;

/// <summary>
/// A two-dimensional box-blur with separated kernels
/// </summary>
public class FastBoxFilter
{
    #region fields

    private int _radius;

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

        var avg = 1f / _radius;

        for (var j = 0; j < height; j++)
        {
            var hSum = 0f;

            for (var x = 0; x < _radius; x++)
            {
                hSum += targetRef[x][j].Z;
            }

            var iAvg = hSum * avg;

            for (var i = 0; i < width; i++)
            {
                if (i - _radius / 2 >= 0 && i + 1 + _radius / 2 < width)
                {
                    hSum -= targetRef[i - _radius / 2][j].Z;

                    var tmp = targetRef[i + 1 + _radius / 2][j].Z;
                    hSum += tmp;

                    iAvg = hSum * avg;
                }

                targetRef[i][j].Z = iAvg;
            }
        }

        // need copy ?
        // Bitmap total = Hblur.Clone();

        for (var i = 0; i < width; i++)
        {
            var tSum = 0f;
            for (var y = 0; y < _radius; y++)
            {
                var tmpColor = targetRef[i][y].Z;
                tSum += tmpColor;
            }

            var iAvg = tSum * avg;

            for (var j = 0; j < height; j++)
            {
                if (j - _radius / 2 >= 0 && j + 1 + _radius / 2 < height)
                {
                    var tmpPColor = targetRef[i][j - _radius / 2].Z;
                    tSum -= tmpPColor;

                    var tmpNColor = targetRef[i][j + 1 + _radius / 2].Z;
                    tSum += tmpNColor;
                    //
                    iAvg = tSum * avg;
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
    }

    #endregion
}
