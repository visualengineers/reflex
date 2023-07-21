using BenchmarkDotNet.Attributes;
using PointCloud.Benchmark.Common;
using PointCloud.Benchmark.Util;

namespace PointCloud.Benchmark.Benchmarks.IteratePointCloud;

[MemoryDiagnoser]
public class IterationMethods
{
    private int _width;
    private int _height;

    private readonly PointCloud3 _pCloud3;

    public IterationMethods()
    {
        var data = DataLoader.Load();
        _width = data.Item1;
        _height = data.Item2;


        _pCloud3 = new PointCloud3(_width, _height);
        _pCloud3.Update(data.Item3);
    }

    [Benchmark]
    public float Iterate1dIndex()
    {
        var value = 0f;
        for (var i = 0; i < _pCloud3.Size; i++)
        {
            value = _pCloud3[i].Z;
        }

        return value;
    }
    
    [Benchmark]
    public float Iterate2dIndex()
    {
        var value = 0f;
        for (var x = 0; x < _pCloud3.SizeX; x++)
        {
            for(var y = 0; y < _pCloud3.SizeY; y++)
                value = _pCloud3[x,y].Z;
        }

        return value;
    }
    
    [Benchmark]
    public float IterateArray()
    {
        var value = 0f;
        var array = _pCloud3.AsArray();
        for (var i = 0; i < _pCloud3.Size; i++)
        {
            value = array[i].Z;
        }

        return value;
    }
    
    [Benchmark]
    public float IterateJaggedArray()
    {
        var value = 0f;
        var array = _pCloud3.AsJaggedArray();
        for (var x = 0; x < _pCloud3.SizeX; x++)
        {
            for(var y = 0; y < _pCloud3.SizeY; y++)
                value = array[x][y].Z;
        }

        return value;
    }
    
    [Benchmark]
    public float IterateSpan()
    {
        var value = 0f;
        var span = _pCloud3.AsArray().AsSpan();
        for (var i = 0; i < _pCloud3.SizeX; i++)
        {
            value = span[i].Z;
        }

        return value;
    }
}