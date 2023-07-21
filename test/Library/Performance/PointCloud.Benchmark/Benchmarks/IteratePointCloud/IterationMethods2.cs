using BenchmarkDotNet.Attributes;
using PointCloud.Benchmark.Util;
using ReFlex.Core.Common.Components;

namespace PointCloud.Benchmark.Benchmarks.IteratePointCloud;

[MemoryDiagnoser]
public class IterationMethods2
{
    private int _width;
    private int _height;

    private Common.PointCloud3 _pCloud3;

    private int _stopRow = 150;
    private int _stopCol = 200;
    
    public Common.PointCloud3 Points { get => _pCloud3; } 

    public void ComputeColRow(int idx, out int x, out int y)
    {
        x = idx % _width;
        y = idx / _width;
    }

    public void ComputeIndex(int x, int y, out int index)
    {
        index = y * _width + x;
    }

    public IterationMethods2()
    {
        var data = DataLoader.Load();
        Init(data.Item3, data.Item1, data.Item2);

    }

    public IterationMethods2(Point3[] data, int width, int height)
    {
        Init(data, width, height);
    }

    private void Init(Point3[] data, int width, int height)
    {
        _width = width;
        _height = height;
        
        _stopRow = (int)(0.66 * _height);
        _stopCol = (int)(0.75 * _width);

        _pCloud3 = new Common.PointCloud3(_width, _height);
        _pCloud3.Update(data);
    }


    [Benchmark]
    public Tuple<float, int> Iterate2dIndexReconstruction()
    {
        var value = 0f;
        var n = 0;
        for (var x = 0; x < _pCloud3.SizeX; x++)
        {
            for (var y = 0; y < _pCloud3.SizeY; y++)
            {
                ComputeIndex(x, y, out var i);
                if (x < _stopCol && y < _stopRow) {
                    value += _pCloud3[i].Z;
                    n++;
                }
            }
        }
        return new Tuple<float, int>(value, n);
    }

    [Benchmark]
    public Tuple<float, int> Iterate2dIndex()
    {
        var value = 0f;
        var n = 0;
        for (var x = 0; x < _pCloud3.SizeX; x++)
        {
            for (var y = 0; y < _pCloud3.SizeY; y++)
            {
                if (x < _stopCol && y < _stopRow) {
                    value += _pCloud3[x, y].Z;
                    n++;
                }
            }
                
        }
        return new Tuple<float, int>(value, n);
    }

    [Benchmark]
    public Tuple<float, int> IterateArray()
    {
        var value = 0f;
        var n = 0;
        var array = _pCloud3.AsArray();

        for (var x = 0; x < _pCloud3.SizeX; x++)
        {
            for (var y = 0; y < _pCloud3.SizeY; y++)
            {
                ComputeIndex(x, y, out var i);
                if (x < _stopCol && y < _stopRow) {
                    value += array[i].Z;
                    n++;
                }
            }
        }
        return new Tuple<float, int>(value, n);
    }
    
    [Benchmark]
    public Tuple<float, int> IterateSpan()
    {
        var value = 0f;
        var n = 0;
        var span = _pCloud3.AsArray();
        for (var x = 0; x < _pCloud3.SizeX; x++)
        {
            for (var y = 0; y < _pCloud3.SizeY; y++)
            {
                ComputeIndex(x, y, out var i);
                if (x < _stopCol && y < _stopRow) {
                    value += span[i].Z;
                    n++;
                }
            }
        }
        return new Tuple<float, int>(value, n);
    }
    
    [Benchmark]
    public Tuple<float, int> IterateArrayCommutative()
    {
        var value = 0f;
        var n = 0;
        var array = _pCloud3.AsArray();
        
        for (var i = 0; i < _pCloud3.Size; i++) {
            ComputeColRow(i, out var x, out var y);
            if (x < _stopCol && y < _stopRow) {
                value += array[i].Z;
                n++;
            }
        }
        return new Tuple<float, int>(value, n);
    }

    [Benchmark]
    public Tuple<float, int> IterateJaggedArray()
    {
        var value = 0f;
        var n = 0;
        var array = _pCloud3.AsJaggedArray();
        for (var x = 0; x < _pCloud3.SizeX; x++)
        {
            for (var y = 0; y < _pCloud3.SizeY; y++)
            {
                if (x < _stopCol && y < _stopRow) {
                    value += array[x][y].Z;
                    n++;
                }
            }
                
        }
        return new Tuple<float, int>(value, n);
    }

    [Benchmark]
    public Tuple<float, int> IterateSpanCommutative()
    {
        var value = 0f;
        var n = 0;
        var span = _pCloud3.AsSpan();
        for (var i = 0; i < _pCloud3.Size; i++)
        {
            ComputeColRow(i, out var x, out var y);
            if (x < _stopCol && y < _stopRow)
            {
                value += span[i].Z;
                n++;
            }
        }
        return new Tuple<float, int>(value, n);
    }
}