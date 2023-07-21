using BenchmarkDotNet.Attributes;
using PointCloud.Benchmark.Util;
using ReFlex.Core.Common.Components;
using ArrayUtils = PointCloud.Benchmark.Common.ArrayUtils;

namespace PointCloud.Benchmark.Benchmarks.UpdatePointCloud;

public class CopyPointCloud
{
    private int _width;
    private int _height;

    private PointCloud3 _pCloud3;

    private Point3[] _data;
    private readonly Point3[] _array;
    private readonly Point3[][] _jaggedArray;

    public CopyPointCloud()
    {
        var data = DataLoader.Load();
        _width = data.Item1;
        _height = data.Item2;


        _pCloud3 = new PointCloud3(_width, _height);
        _data = data.Item3;

        _array = _pCloud3.AsArray();
        _jaggedArray = _pCloud3.AsJaggedArray();
    }
    
    [Benchmark]
    public void Copy()
    {
        var copy = new PointCloud3(_pCloud3.SizeX, _pCloud3.SizeY);
        copy.Update(_pCloud3.AsArray(), 0f);
        _pCloud3 = copy;
    }
    
    [Benchmark]
    public void Init1d()
    {
        ArrayUtils.InitializeArray(out Point3[] init, _pCloud3.Size);
    }
    
    [Benchmark]
    public void Init2d()
    {
        ArrayUtils.InitializeArray(out Point3[][] init, _pCloud3.SizeX, _pCloud3.SizeY);
    }
    
    [Benchmark]
    public void Init1dSpan()
    {
        ArrayUtils.InitializeSpan(out Span<Point3> init, _pCloud3.Size);
    }
    
    [Benchmark]
    public void Init2dSpan()
    {
        ArrayUtils.InitializeSpan(out Span<Point3[]> init, _pCloud3.SizeX, _pCloud3.SizeY);
    }
    
    [Benchmark]
    public void Ref()
    {
        ArrayUtils.ReferencingArrays(_array, _jaggedArray);
    }
    
    [Benchmark]
    public void RefSpan()
    {
        ArrayUtils.ReferencingArrays(_array.AsSpan(), _jaggedArray.AsSpan());
    }
}