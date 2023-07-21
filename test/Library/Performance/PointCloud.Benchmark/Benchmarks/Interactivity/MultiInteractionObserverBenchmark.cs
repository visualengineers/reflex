using BenchmarkDotNet.Attributes;
using Implementation.Components;
using PointCloud.Benchmark.Interactivity;
using PointCloud.Benchmark.Util;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;

namespace PointCloud.Benchmark.Benchmarks.Interactivity;

[MemoryDiagnoser]
public class MultiInteractionObserverBenchmark
{
    private int _width;
    private int _height;

    private readonly PointCloud3 _pCloud3;
    private readonly VectorField2 _vectorfield;

    private readonly MultiInteractionObserver _observer;

    private Point3[] _data;

    public MultiInteractionObserverBenchmark()
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
    }

    [Benchmark]
    public async Task<ProcessingResult> Update()
    {
        var result = await _observer.Update();

        return result;
    }

    [Benchmark]
    public void UpdateVectorField()
    {
        _observer.UpdateVectorfield();
    }
    
    [Benchmark]
    public void UpdateVectorFieldParallel()
    {
        _observer.UpdateVectorfieldParallel();
    }
    
    [Benchmark]
    public void UpdateVectorFieldParallelStepped()
    {
        _observer.UpdateVectorfieldParallelStepped();
    }
    
    [Benchmark]
    public void UpdateVectorFieldStepped1d()
    {
        _observer.UpdateVectorfieldStepped1d();
    }
    
    [Benchmark]
    public void UpdateVectorFieldSteppedParallel1d()
    {
        _observer.UpdateVectorfieldSteppedParallel1d();
    }
}