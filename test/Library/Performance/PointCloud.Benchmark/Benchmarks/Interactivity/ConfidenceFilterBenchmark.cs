using BenchmarkDotNet.Attributes;
using Implementation.Components;
using PointCloud.Benchmark.Interactivity;
using PointCloud.Benchmark.Util;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;

namespace PointCloud.Benchmark.Benchmarks.Interactivity;

[MemoryDiagnoser]
public class ConfidenceFilterBenchmark
{
    private int _width;
    private int _height;

    private readonly ReFlex.Core.Common.Components.PointCloud3 _pCloud3;
    private readonly VectorField2 _vectorfield;

    private readonly MultiInteractionObserver _observer;

    private Point3[] _data;

    public ConfidenceFilterBenchmark()
    {
        var data = DataLoader.Load(0);
        _width = data.Item1;
        _height = data.Item2;
        _data = data.Item3;

        _pCloud3 = new PointCloud3(_width, _height);
        _pCloud3.Update(data.Item3, 0f);

        var filterMgr = new FilterManager();
        filterMgr.LimitationFilter.LeftBound = 42;
        filterMgr.LimitationFilter.RightBound = 613;
        filterMgr.LimitationFilter.LeftBound = 136;
        filterMgr.LimitationFilter.LeftBound = 413;

        filterMgr.IsLimitationFilterEnabled = true;
        filterMgr.IsBoxFilterEnabled = true;
        filterMgr.IsValueFilterEnabled = true;
        filterMgr.MeasurePerformance = false;
        filterMgr.IsThresholdFilterEnabled = true;

        filterMgr.LimitationFilterType = LimitationFilterType.LimitationFilter;

        filterMgr.FilterAndUpdate(_data, _pCloud3);
        
        _vectorfield = new VectorField2(_width, _height, 1);
        _vectorfield.Populate(_pCloud3);
        
        _observer = new MultiInteractionObserver();
        _observer.PointCloud = _pCloud3;
        _observer.VectorField = _vectorfield;

        _observer.MinDistance = 0.04f;
        _observer.MaxDistance = 0.3f;
        _observer.Distance = 1.45f;
        _observer.MinAngle = 0.5f;
        _observer.TouchMergeDistance2D = 19;

        Task.WaitAny(_observer.Update());
    }

    [Benchmark]
    public Interaction[] FilterInteractions1()
    {
        return _observer.ApplyConfidenceFilter1().ToArray();
    }
    
    [Benchmark]
    public Interaction[] FilterInteractions2()
    {
        return _observer.ApplyConfidenceFilter2().ToArray();
    }
    
    [Benchmark]
    public Interaction[] FilterInteractions3()
    {
        return _observer.ApplyConfidenceFilter3().ToArray();
    }
    
    [Benchmark]
    public Interaction[] FilterInteractions4()
    {
        return _observer.ApplyConfidenceFilter4().ToArray();
    }
}