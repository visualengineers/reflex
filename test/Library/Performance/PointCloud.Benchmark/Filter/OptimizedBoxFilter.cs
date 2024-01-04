using ReFlex.Core.Common.Components;
using Math = System.Math;

namespace PointCloud.Benchmark.Filter;

public class OptimizedBoxFilter
{
    #region fields

    private int _radius;
    private int _numPasses = 3;
    
    private readonly ParallelOptions _pOptions = new() { MaxDegreeOfParallelism = -1 };

    private int[] _boxes;

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
        set
        {
            if (_radius == value)
                return;
            _radius = value;
            UpdateRadius();
        }
    }

    public int NumPasses
    {
        get => _numPasses;
        set
        {
            if (_numPasses == value)
                return;
            _numPasses = value;
            UpdateRadius();
        }
    }

    public float DefaultValue { get; set; }

    #endregion
    
    #region constructor

    /// <summary>
    /// Initializes a new instance of the <see cref="BoxFilter"/> class.
    /// </summary>
    /// <param name="radius">The radius.</param>
    /// <param name="maxParallelism">max number of parallel threads to use.
    /// -1 (default value) for automatic Task generation, best results for matching number with current number of available cores.</param>
    public OptimizedBoxFilter(int radius, int numPasses = 3, int maxParallelism = -1)
    {
        if (numPasses > 0)
            _numPasses = numPasses;

        Radius = radius;
        _pOptions.MaxDegreeOfParallelism = maxParallelism;
    } 

    #endregion

    #region methods

    /// <summary>
    /// Filters highly frequented changes in a field of <see cref="Point3"/>.
    /// </summary>
    public void FilterWithCopyParallel(Common.PointCloud3 target)
    {
        var values = target.AsSpan();

        var source = new float[target.Size].AsSpan();
        var dest = new float[target.Size];

        for (var i = 0; i < values.Length; i++)
        {
            source[i] = values[i].Z;
        }
        
        BoxBlurArrayParallel(source.ToArray(), dest, target.SizeX, target.SizeY);
        
        for (var i = 0; i < source.Length; i++)
        {
            target[i].Z = source[i];
        }
    }
    
    /// <summary>
    /// Filters highly frequented changes in a field of <see cref="Point3"/>.
    /// </summary>
    public void FilterWithCopyParallelMemory(Common.PointCloud3 target)
    {
        var values = target.AsSpan();

        var source = new float[target.Size];
        var dest = new float[target.Size];

        for (var i = 0; i < values.Length; i++)
        {
            source[i] = values[i].Z;
        }
        
        BoxBlurArrayParallelMem(source.AsMemory(), dest, target.SizeX, target.SizeY);
        
        for (var i = 0; i < source.Length; i++)
        {
            target[i].Z = source[i];
        }
    }
    
    /// <summary>
    /// Filters highly frequented changes in a field of <see cref="Point3"/>.
    /// </summary>
    public void FilterWithCopy(Common.PointCloud3 target)
    {
        var values = target.AsSpan();

        var source = new float[target.Size].AsSpan();
        var dest = new float[target.Size];

        for (var i = 0; i < values.Length; i++)
        {
            source[i] = values[i].Z;
        }
        
        BoxBlurArray(source.ToArray(), dest, target.SizeX, target.SizeY);
        
        for (var i = 0; i < source.Length; i++)
        {
            target[i].Z = source[i];
        }
    }
    
    /// <summary>
    /// Filters highly frequented changes in a field of <see cref="Point3"/>.
    /// </summary>
    public void FilterWithCopySpan(Common.PointCloud3 target)
    {
        var values = target.AsSpan();

        var source = new float[target.Size].AsSpan();
        var dest = new float[target.Size].AsSpan();

        for (var i = 0; i < values.Length; i++)
        {
            source[i] = values[i].Z;
        }
        
        BoxBlurArraySpan(source, dest, target.SizeX, target.SizeY);
        
        for (var i = 0; i < source.Length; i++)
        {
            target[i].Z = source[i];
        }
    }
    
    /// <summary>
    /// Filters highly frequented changes in a field of <see cref="Point3"/>.
    /// </summary>
    public void Filter(Common.PointCloud3 target)
    {
        var source = target.AsSpan();
        
        var dest = new Point3[target.Size].AsSpan();

        BoxBlurPointSpan(source, dest, target.SizeX, target.SizeY);
        
        for (var i = 0; i < source.Length; i++)
        {
            target[i] = source[i];
        }
    }
    
    /// <summary>
    /// Sets the radius and calculates the diameter.
    /// </summary>
    /// <param name="radius">The radius.</param>
    private void UpdateRadius()
    {
        _boxes = BoxesForGauss(_radius, _numPasses);
    }

    #endregion
    
    #region private methods
    
    private int[] BoxesForGauss(int sigma, int n)
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
    
    private void BoxBlurArray(float[] source, float[] dest, int w, int h)
    {
        for (var i = 0; i < source.Length; i++) 
            dest[i] = source[i];

        for (var n = 0; n < _numPasses; n++)
        {
            boxBlurH(dest, source, w, h, (_boxes[n] - 1) / 2);
            boxBlurT(source, dest, w, h, (_boxes[n] - 1) / 2);
        }
    }
    
    private void BoxBlurArraySpan(Span<float> source, Span<float> dest, int w, int h)
    {
        for (var i = 0; i < source.Length; i++) 
            dest[i] = source[i];

        for (var n = 0; n < _numPasses; n++)
        {
            boxBlurHSpan(dest, source, w, h, (_boxes[n] - 1) / 2);
            boxBlurTSpan(source, dest, w, h, (_boxes[n] - 1) / 2);
        }
    }
    
    private void BoxBlurArrayParallelMem(Memory<float> source, Memory<float> dest, int w, int h)
    {
        source.CopyTo(dest);

        for (var n = 0; n < _numPasses; n++)
        {
            boxBlurH_ParallelMem(dest, source, w, h, (_boxes[n] - 1) / 2);
            boxBlurT_ParallelMem(source, dest, w, h, (_boxes[n] - 1) / 2);
        }
    }
    
    private void BoxBlurArrayParallel(float[] source, float[] dest, int w, int h)
    {
        for (var i = 0; i < source.Length; i++) 
            dest[i] = source[i];

        for (var n = 0; n < _numPasses; n++)
        {
            boxBlurH_Parallel(dest, source, w, h, (_boxes[n] - 1) / 2);
            boxBlurT_Parallel(source, dest, w, h, (_boxes[n] - 1) / 2);
        }
    }
    
    private void BoxBlurPointSpan(Span<Point3> source, Span<Point3> dest, int w, int h)
    {
        for (var i = 0; i < source.Length; i++) 
            dest[i] = source[i];

        for (var n = 0; n < _numPasses; n++)
        {
            boxBlurH_Point3(dest, source, w, h, (_boxes[n] - 1) / 2);
            boxBlurT_Point3(source, dest, w, h, (_boxes[n] - 1) / 2);
        }
    }
    
    private void boxBlurH_Parallel(float[] source, float[] dest, int w, int h, int r)
    {
        var iar = (float)1 / (r + r + 1);
        Parallel.For(0, h, _pOptions, i =>
        {
            var ti = i * w;
            var li = ti;
            var ri = ti + r;
            var fv = source[ti];
            var lv = source[ti + w - 1];
            var val = (r + 1) * fv;
            for (var j = 0; j < r; j++) 
                val += source[ti + j];
            for (var j = 0; j <= r; j++)
            {
                val += source[ri++] - fv;
                dest[ti++] = (float)Math.Round(val * iar);
            }
            for (var j = r + 1; j < w - r; j++)
            {
                val += source[ri++] - dest[li++];
                dest[ti++] = (float)Math.Round(val * iar);
            }
            for (var j = w - r; j < w; j++)
            {
                val += lv - source[li++];
                dest[ti++] = (float)Math.Round(val * iar);
            }
        });
    }
    
    private void boxBlurH_ParallelMem(Memory<float> source, Memory<float> dest, int w, int h, int r)
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
                dest.Span[ti++] = (float)Math.Round(val * iar);
            }
            for (var j = r + 1; j < w - r; j++)
            {
                val += source.Span[ri++] - dest.Span[li++];
                dest.Span[ti++] = (float)Math.Round(val * iar);
            }
            for (var j = w - r; j < w; j++)
            {
                val += lv - source.Span[li++];
                dest.Span[ti++] = (float)Math.Round(val * iar);
            }
        });
    }
    
    private void boxBlurH(float[] source, float[] dest, int w, int h, int r)
    {
        var iar = (float)1 / (r + r + 1);
        for (var i = 0; i < h; i++)
        {
            var ti = i * w;
            var li = ti;
            var ri = ti + r;
            var fv = source[ti];
            var lv = source[ti + w - 1];
            var val = (r + 1) * fv;
            for (var j = 0; j < r; j++) 
                val += source[ti + j];
            for (var j = 0; j <= r; j++)
            {
                val += source[ri++] - fv;
                dest[ti++] = (float)Math.Round(val * iar);
            }
            for (var j = r + 1; j < w - r; j++)
            {
                val += source[ri++] - dest[li++];
                dest[ti++] = (float)Math.Round(val * iar);
            }
            for (var j = w - r; j < w; j++)
            {
                val += lv - source[li++];
                dest[ti++] = (float)Math.Round(val * iar);
            }
        }
    }
    
    private void boxBlurHSpan(Span<float> source, Span<float> dest, int w, int h, int r)
    {
        var iar = (float)1 / (r + r + 1);
        for (var i = 0; i < h; i++)
        {
            var ti = i * w;
            var li = ti;
            var ri = ti + r;
            var fv = source[ti];
            var lv = source[ti + w - 1];
            var val = (r + 1) * fv;
            for (var j = 0; j < r; j++) 
                val += source[ti + j];
            for (var j = 0; j <= r; j++)
            {
                val += source[ri++] - fv;
                dest[ti++] = (float)Math.Round(val * iar);
            }
            for (var j = r + 1; j < w - r; j++)
            {
                val += source[ri++] - dest[li++];
                dest[ti++] = (float)Math.Round(val * iar);
            }
            for (var j = w - r; j < w; j++)
            {
                val += lv - source[li++];
                dest[ti++] = (float)Math.Round(val * iar);
            }
        }
    }
    
    private void boxBlurH_Point3(Span<Point3> source, Span<Point3> dest, int w, int h, int r)
    {
        var iar = (float)1 / (r + r + 1);
        for (var i = 0; i < h; i++)
        {
            var ti = i * w;
            var li = ti;
            var ri = ti + r;
            var fv = source[ti].Z;
            var lv = source[ti + w - 1].Z;
            var val = (r + 1) * fv;
            for (var j = 0; j < r; j++) 
                val += source[ti + j].Z;
            for (var j = 0; j <= r; j++)
            {
                val += source[ri++].Z - fv;
                dest[ti++].Z = (float)Math.Round(val * iar);
            }
            for (var j = r + 1; j < w - r; j++)
            {
                val += source[ri++].Z - dest[li++].Z;
                dest[ti++].Z = (float)Math.Round(val * iar);
            }
            for (var j = w - r; j < w; j++)
            {
                val += lv - source[li++].Z;
                dest[ti++].Z = (float)Math.Round(val * iar);
            }
        }
    }
    
    private void boxBlurT_Parallel(float[] source, float[] dest, int w, int h, int r)
    {
        var iar = (float)1 / (r + r + 1);
        Parallel.For(0, w, _pOptions, i =>
        {
            var ti = i;
            var li = ti;
            var ri = ti + r * w;
            var fv = source[ti];
            var lv = source[ti + w * (h - 1)];
            var val = (r + 1) * fv;
            for (var j = 0; j < r; j++) 
                val += source[ti + j * w];
            for (var j = 0; j <= r; j++)
            {
                val += source[ri] - fv;
                dest[ti] = (float)Math.Round(val * iar);
                ri += w;
                ti += w;
            }
            for (var j = r + 1; j < h - r; j++)
            {
                val += source[ri] - source[li];
                dest[ti] = (float)Math.Round(val * iar);
                li += w;
                ri += w;
                ti += w;
            }
            for (var j = h - r; j < h; j++)
            {
                val += lv - source[li];
                dest[ti] = (float)Math.Round(val * iar);
                li += w;
                ti += w;
            }
        });
    }
    
    private void boxBlurT_ParallelMem(Memory<float> source, Memory<float>  dest, int w, int h, int r)
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
                dest.Span[ti] = (float)Math.Round(val * iar);
                ri += w;
                ti += w;
            }
            for (var j = r + 1; j < h - r; j++)
            {
                val += source.Span[ri] - source.Span[li];
                dest.Span[ti] = (float)Math.Round(val * iar);
                li += w;
                ri += w;
                ti += w;
            }
            for (var j = h - r; j < h; j++)
            {
                val += lv - source.Span[li];
                dest.Span[ti] = (float)Math.Round(val * iar);
                li += w;
                ti += w;
            }
        });
    }
    
    private void boxBlurT(float[] source, float[] dest, int w, int h, int r)
    {
        var iar = (float)1 / (r + r + 1);
        for (var i = 0; i < w; i++)
        {
            var ti = i;
            var li = ti;
            var ri = ti + r * w;
            var fv = source[ti];
            var lv = source[ti + w * (h - 1)];
            var val = (r + 1) * fv;
            for (var j = 0; j < r; j++) 
                val += source[ti + j * w];
            for (var j = 0; j <= r; j++)
            {
                val += source[ri] - fv;
                dest[ti] = (float)Math.Round(val * iar);
                ri += w;
                ti += w;
            }
            for (var j = r + 1; j < h - r; j++)
            {
                val += source[ri] - source[li];
                dest[ti] = (float)Math.Round(val * iar);
                li += w;
                ri += w;
                ti += w;
            }
            for (var j = h - r; j < h; j++)
            {
                val += lv - source[li];
                dest[ti] = (float)Math.Round(val * iar);
                li += w;
                ti += w;
            }
        }
    }
    
    private void boxBlurTSpan(Span<float> source, Span<float> dest, int w, int h, int r)
    {
        var iar = (float)1 / (r + r + 1);
        for (var i = 0; i < w; i++)
        {
            var ti = i;
            var li = ti;
            var ri = ti + r * w;
            var fv = source[ti];
            var lv = source[ti + w * (h - 1)];
            var val = (r + 1) * fv;
            for (var j = 0; j < r; j++) 
                val += source[ti + j * w];
            for (var j = 0; j <= r; j++)
            {
                val += source[ri] - fv;
                dest[ti] = (float)Math.Round(val * iar);
                ri += w;
                ti += w;
            }
            for (var j = r + 1; j < h - r; j++)
            {
                val += source[ri] - source[li];
                dest[ti] = (float)Math.Round(val * iar);
                li += w;
                ri += w;
                ti += w;
            }
            for (var j = h - r; j < h; j++)
            {
                val += lv - source[li];
                dest[ti] = (float)Math.Round(val * iar);
                li += w;
                ti += w;
            }
        }
    }
    
    private void boxBlurT_Point3(Span<Point3> source, Span<Point3> dest, int w, int h, int r)
    {
        var iar = (float)1 / (r + r + 1);
        for (var i = 0; i < w; i++)
        {
            var ti = i;
            var li = ti;
            var ri = ti + r * w;
            var fv = source[ti].Z;
            var lv = source[ti + w * (h - 1)].Z;
            var val = (r + 1) * fv;
            for (var j = 0; j < r; j++) 
                val += source[ti + j * w].Z;
            for (var j = 0; j <= r; j++)
            {
                val += source[ri].Z - fv;
                dest[ti].Z = (float)Math.Round(val * iar);
                ri += w;
                ti += w;
            }
            for (var j = r + 1; j < h - r; j++)
            {
                val += source[ri].Z - source[li].Z;
                dest[ti].Z = (float)Math.Round(val * iar);
                li += w;
                ri += w;
                ti += w;
            }
            for (var j = h - r; j < h; j++)
            {
                val += lv - source[li].Z;
                dest[ti].Z = (float)Math.Round(val * iar);
                li += w;
                ti += w;
            }
        }
    }
    
    #endregion
}