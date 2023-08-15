using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ReFlex.Core.Common.Components;
using Math = System.Math;

namespace ReFlex.Core.Filtering.Components;

/// <summary>
/// Speed-optimized version of the Box filter based on the implementation
/// in https://blog.ivank.net/fastest-gaussian-blur.html
/// Optimized for using .NET SIMD structures <see cref="Span{T}"/> and <see cref="Memory{T}"/>
/// as well as Parallel computation of values.
/// </summary>
public class OptimizedBoxFilter
{
    #region Fields

    private int _radius;
    private int _numPasses = 3;
    
    private readonly ParallelOptions _pOptions = new() { MaxDegreeOfParallelism = -1 };

    private int[] _boxes;

    #endregion

    #region Properties

    /// <summary>
    /// Gets or sets the radius.
    /// </summary>
    /// <value>
    /// The radius of the box blur.
    /// </value>
    public int Radius
    {
        get => _radius;
        set => _radius = value;
    }
    
    public int NumPasses
    {
        get => _numPasses;
        set
        {
            if (_numPasses == value || value < 1)
                return;
            _numPasses = value;
        }
    }
    
    public int NumThreads
    {
        get => _pOptions.MaxDegreeOfParallelism;
        set => _pOptions.MaxDegreeOfParallelism = value > 0 ? value : -1;
    }
        
    public float DefaultValue { get; set; }

    #endregion
    
    #region constructor

    /// <summary>
    /// Initializes a new instance of the <see cref="BoxFilter"/> class.
    /// </summary>
    /// <param name="radius">the radius of the blur.</param>
    /// <param name="numPasses">number of box blur passes to apply, defaults to 3</param>
    /// <param name="maxParallelism">max number of parallel threads to use.
    /// -1 (default value) for automatic task generation, best results for matching number with current number of available cores.</param>
    public OptimizedBoxFilter(int radius, int numPasses = 3, int maxParallelism = -1)
    {
        if (numPasses > 0)
            _numPasses = numPasses;

        Radius = radius;
        NumThreads = maxParallelism;
    } 

    #endregion
    
    #region Methods

    /// <summary>
    /// Filters highly frequented changes in a field of <see cref="Point3"/>.
    /// Only applied to Z-Values. These are copied into a buffer, which afterwards is blurred
    /// (using a second buffer for ping-pong storage of results for blurring each direction)
    /// Box Blur is computes separately in horizontal and vertical direction for each pass using
    /// the accumulator function.
    /// Optimized by using <see cref="Span{T}"/> for iterating PointCloud
    /// and <see cref="Memory{T}"/> for Parallelized operation on z-values.
    /// </summary>
    /// /// <summary>
    /// Filters highly frequented changes in a field of <see cref="Point3"/>.
    /// </summary>
    public void Filter(Point3[] depthData, int width, int height, int size)
    {
        // skip filtering, if radius is 1 or less
        if (_radius <= 1)
            return;

        _boxes = ComputeBoxesForGauss(_radius, _numPasses);

        var values = depthData.AsSpan();

        var source = new float[size];
        var dest = new float[size];

        for (var i = 0; i < values.Length; i++)
        {
            source[i] = values[i].Z;
        }
        
        BoxBlurArray(source.AsMemory(), dest, width, height);

        for (var i = 0; i < source.Length; i++)
        {
            var point = values[i];
            point.Z = dest[i];
            values[i].Set(point);
        }
    }
    
    /// <summary>
    /// Updates the Boxes Based on the radius and number of iterations
    /// </summary>
    private void UpdateRadius()
    {
        _boxes = ComputeBoxesForGauss(_radius, 3);
    }

    #endregion
    
    #region Box Blur Implementation
    
    /// <summary>
    /// computes the box size for box filter for approximating a gaussian blur with equal radius (sigma)
    /// </summary>
    /// <param name="sigma"></param>
    /// <param name="n"></param>
    /// <returns></returns>
    private static int[] ComputeBoxesForGauss(int sigma, int n)
    {
        var wIdeal = Math.Sqrt((12 * sigma * sigma / n) + 1);
        var wl = (int)Math.Floor(wIdeal);
        if (wl % 2 == 0) 
            wl--;
        var wu = wl + 2;

        var mIdeal = (double)(12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4);
        var m = Math.Round(mIdeal);

        var sizes = new List<int>();
        for (var i = 0; i < n; i++) 
            sizes.Add(i < m ? wl : wu);
        return sizes.ToArray();
    }
    
    
    /// <summary>
    /// Applies Box Blur in horizontal adn then vertical direction, in the number of iterations defined by <see cref="NumPasses"/>
    /// </summary>
    /// <param name="source">Array containing depth values</param>
    /// <param name="dest">empty array with the same size as <see cref="source"/>. Values are copied between both arrays.</param>
    /// <param name="w">width of the depth image</param>
    /// <param name="h">height of the depth image</param>
    private void BoxBlurArray(Memory<float> source, Memory<float> dest, int w, int h)
    {
        source.CopyTo(dest);
        
        for (var n = 0; n < _numPasses; n++)
        {
            BoxBlurIterationHorizontal(dest, source, w, h, (_boxes[n] - 1) / 2);
            BoxBlurIterationVertical(source, dest, w, h, (_boxes[n] - 1) / 2);
        }
    }
    
    /// <summary>
    /// Applies box blur in horizontal direction.
    /// </summary>
    /// <param name="source">Array containing depth values</param>
    /// <param name="dest">empty array with the same size as <see cref="source"/>. Values are copied between both arrays.</param>
    /// <param name="w">width of the depth image</param>
    /// <param name="h">height of the depth image</param>
    /// <param name="r">radius of the box blur window, computed in<see cref="ComputeBoxesForGauss"/></param>
    private void BoxBlurIterationHorizontal(Memory<float> source, Memory<float> dest, int w, int h, int r)
    {
        var iar = (float)1 / (r + r + 1);
        Parallel.For(0, h, _pOptions, i =>
        {
            var ti = i * w;
            var li = ti;
            var ri = ti + r;
            var fv = source.Span[ti];
            var lv = source.Span[ti + w - 1];
            var val = (r + 1) * fv;
            for (var j = 0; j < r; j++) 
                val += source.Span[ti + j];
            for (var j = 0; j <= r; j++)
            {
                val += source.Span[ri++] - fv;
                dest.Span[ti++] = val * iar;
            }
            for (var j = r + 1; j < w - r; j++)
            {
                val += source.Span[ri++] - source.Span[li++];
                dest.Span[ti++] = val * iar;
            }
            for (var j = w - r; j < w; j++)
            {
                val += lv - source.Span[li++];
                dest.Span[ti++] = val * iar;
            }
        });
    }
    
    /// <summary>
    /// Applies box blur in vertical direction.
    /// </summary>
    /// <param name="source">Array containing depth values</param>
    /// <param name="dest">empty array with the same size as <see cref="source"/>. Values are copied between both arrays.</param>
    /// <param name="w">width of the depth image</param>
    /// <param name="h">height of the depth image</param>
    /// <param name="r">radius of the box blur window, computed in<see cref="ComputeBoxesForGauss"/></param>

    private void BoxBlurIterationVertical(Memory<float> source, Memory<float>  dest, int w, int h, int r)
    {
        var iar = (float)1 / (r + r + 1);
        Parallel.For(0, w, _pOptions, i =>
        {
            var ti = i;
            var li = ti;
            var ri = ti + r * w;
            var fv = source.Span[ti];
            var lv = source.Span[ti + w * (h - 1)];
            var val = (r + 1) * fv;
            for (var j = 0; j < r; j++) 
                val += source.Span[ti + j * w];
            for (var j = 0; j <= r; j++)
            {
                val += source.Span[ri] - fv;
                dest.Span[ti] = val * iar;
                ri += w;
                ti += w;
            }
            for (var j = r + 1; j < h - r; j++)
            {
                val += source.Span[ri] - source.Span[li];
                dest.Span[ti] = val * iar;
                li += w;
                ri += w;
                ti += w;
            }
            for (var j = h - r; j < h; j++)
            {
                val += lv - source.Span[li];
                dest.Span[ti] = val * iar;
                li += w;
                ti += w;
            }
        });
    }
    
    #endregion
}