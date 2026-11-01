// See https://aka.ms/new-console-template for more information

using BenchmarkDotNet.Reports;
using BenchmarkDotNet.Configs;
using BenchmarkDotNet.Jobs;
using BenchmarkDotNet.Running;
using PointCloud.Benchmark.Benchmarks.Filter;
using PointCloud.Benchmark.Benchmarks.Interactivity;
using PointCloud.Benchmark.Benchmarks.IteratePointCloud;
using PointCloud.Benchmark.Benchmarks.UpdatePointCloud;

namespace PointCloud.Benchmark;

public class Program
{
    public static void Main(string[] args)
    {
        if (args.Contains("--observer-comparison"))
        {
            BenchmarkSwitcher.FromTypes(new[] { typeof(ObserverExtremumComparison), typeof(ObserverSmoothingComparison) })
                .Run(args.Where(arg => arg != "--observer-comparison").ToArray(),
                    BenchmarkDotNet.Configs.DefaultConfig.Instance.AddJob(
                        BenchmarkDotNet.Jobs.Job.ShortRun.WithToolchain(
                            BenchmarkDotNet.Toolchains.InProcess.Emit.InProcessEmitToolchain.Instance)));
            return;
        }
        // var summary1 = BenchmarkBoxFilter();
        //
        // var summary2 = BenchmarkIteration1();

        // var summary3 = BenchmarkIteration2();

        // var summary4 = BenchmarkUpdate();

        // var summary5 = BenchmarkCopy();

        // var summary6 = BenchmarkInteractions();

        var summary7 = BenchmarkConfidenceFilter();

    }
    
    private static Summary BenchmarkBoxFilter() => BenchmarkRunner.Run<BoxBlur>();
    
    private static Summary BenchmarkIteration1() => BenchmarkRunner.Run<IterationMethods>();

    private static Summary BenchmarkIteration2() => BenchmarkRunner.Run<IterationMethods2>();
    
    private static Summary BenchmarkUpdate() => BenchmarkRunner.Run<UpdateMethods>();
    
    private static Summary BenchmarkCopy() => BenchmarkRunner.Run<CopyPointCloud>();
    
    private static Summary BenchmarkInteractions() => BenchmarkRunner.Run<MultiInteractionObserverBenchmark>();
    
    private static Summary BenchmarkConfidenceFilter() => BenchmarkRunner.Run<ConfidenceFilterBenchmark>();

}
