using BenchmarkDotNet.Attributes;
using PointCloud.Benchmark.Common;
using PointCloud.Benchmark.Filter;
using PointCloud.Benchmark.Util;

namespace PointCloud.Benchmark.Benchmarks.Filter;

[MemoryDiagnoser]
public class BoxBlur
{
    private int _width;
    private int _height;

    private readonly PointCloud3 _pCloud3;

    private readonly BoxFilter _boxFilterOld = new BoxFilter(10);
    private readonly FastBoxFilter _fastBoxFilter = new FastBoxFilter(10);
    
    private readonly OptimizedBoxFilter _boxFilterOpt1 = new OptimizedBoxFilter(10);
    private readonly OptimizedBoxFilter _boxFilterOpt2 = new OptimizedBoxFilter(10, 3, 16);
    private readonly OptimizedBoxFilter _boxFilterOpt3 = new OptimizedBoxFilter(10, 3, 8);
    private readonly OptimizedBoxFilter _boxFilterOpt4 = new OptimizedBoxFilter(10);

    private readonly OptimizedBoxFilter _boxFilterOpt4_1 = new OptimizedBoxFilter(10, 1,16);
    private readonly OptimizedBoxFilter _boxFilterOpt4_5 = new OptimizedBoxFilter(10, 5,16);
    
    public BoxBlur()
    {
        var data = DataLoader.Load();
        _width = data.Item1;
        _height = data.Item2;


        _pCloud3 = new PointCloud3(_width, _height);
        _pCloud3.Update(data.Item3);

    }

    [Benchmark]
    public void BoxBlurOld()
    {
        _boxFilterOld.Filter(_pCloud3);
    }
    
    [Benchmark]
    public void BoxBlurOldOptimized()
    {
        _boxFilterOld.FilterOptimized(_pCloud3);
    }
    
    [Benchmark]
    public void FastBoxBlur()
    {
        _fastBoxFilter.Filter(_pCloud3);
    }
    
    [Benchmark]
    public void BoxBlurOptimized_1_WithCopy_Parallel()
    {
        _boxFilterOpt1.FilterWithCopyParallel(_pCloud3);
    }
    
    [Benchmark]
    public void BoxBlurOptimized_1_WithCopy_ParallelMemory32()
    {
        _boxFilterOpt1.FilterWithCopyParallelMemory(_pCloud3);
    }
    
    [Benchmark]
    public void BoxBlurOptimized_1_WithCopy_ParallelMemory16()
    {
        _boxFilterOpt2.FilterWithCopyParallelMemory(_pCloud3);
    }
    
    [Benchmark]
    public void BoxBlurOptimized_1_WithCopy_ParallelMemory8()
    {
        _boxFilterOpt3.FilterWithCopyParallelMemory(_pCloud3);
    }
    
    [Benchmark]
    public void BoxBlurOptimized_1_WithCopy_ParallelMemoryAuto()
    {
        _boxFilterOpt4.FilterWithCopyParallelMemory(_pCloud3);
    }
    
    [Benchmark]
    public void BoxBlurOptimized_1_WithCopy_ParallelMemory16_1Pass()
    {
        _boxFilterOpt4_1.FilterWithCopyParallelMemory(_pCloud3);
    }
    
    [Benchmark]
    public void BoxBlurOptimized_1_WithCopy_ParallelMemory16_5Pass()
    {
        _boxFilterOpt4_5.FilterWithCopyParallelMemory(_pCloud3);
    }
    
    [Benchmark]
    public void BoxBlurOptimized_1_WithCopy()
    {
        _boxFilterOpt1.FilterWithCopy(_pCloud3);
    }
    
    [Benchmark]
    public void BoxBlurOptimized_1_WithCopySpan()
    {
        _boxFilterOpt1.FilterWithCopySpan(_pCloud3);
    }
    
    [Benchmark]
    public void BoxBlurOptimized_1_WithCopyPoint3()
    {
        _boxFilterOpt1.Filter(_pCloud3);
    }

}