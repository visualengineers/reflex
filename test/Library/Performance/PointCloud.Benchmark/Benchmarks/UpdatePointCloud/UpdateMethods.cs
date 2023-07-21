using BenchmarkDotNet.Attributes;
using PointCloud.Benchmark.Util;
using ReFlex.Core.Common.Components;

namespace PointCloud.Benchmark.Benchmarks.UpdatePointCloud;

[MemoryDiagnoser]
public class UpdateMethods
{
    private int _width;
    private int _height;

    private readonly Common.PointCloud3 _pCloud3;

    private Point3[] _data;

    public UpdateMethods()
    {
        var data = DataLoader.Load();
        _width = data.Item1;
        _height = data.Item2;


        _pCloud3 = new Common.PointCloud3(_width, _height);
        _data = data.Item3;
    }

    [Benchmark]
    public void Update()
    {
        _pCloud3.Update(_data);
    }
    
    [Benchmark]
    public void UpdateSpan()
    {
        _pCloud3.Update(_data.AsSpan());
    }
    
    [Benchmark]
    public void UpdateSpan2()
    {
        _pCloud3.Update2(_data.AsSpan());
    }
    
    [Benchmark]
    public void UpdateMemory()
    {
        _pCloud3.Update(_data.AsMemory());
    }
    
    [Benchmark]
    public void UpdateMemoryParallel()
    {
        _pCloud3.UpdateParallel(_data.AsMemory());
    }
    
    [Benchmark]
    public void UpdateParallel()
    {
        _pCloud3.UpdateParallel(_data);
    }
}