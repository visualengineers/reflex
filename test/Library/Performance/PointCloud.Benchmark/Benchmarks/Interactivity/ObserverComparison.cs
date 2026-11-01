using BenchmarkDotNet.Attributes;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Interfaces;
using ReFlex.Core.Interactivity.Util;
using LegacyObserver = PointCloud.Benchmark.Interactivity.MultiInteractionObserver;
using CurrentObserver = ReFlex.Core.Interactivity.Components.MultiInteractionObserver;

namespace PointCloud.Benchmark.Benchmarks.Interactivity;

// Adapters expose the base-class stages without including the different detectors.
public sealed class LegacyObserverAdapter : LegacyObserver
{
    public ExtremumDescription Classify(int x, int y) => ComputeExtremumType(PointCloud.AsJaggedArray(), x, y);
    public InteractionFrame Smooth(IList<Interaction> contacts) => ComputeSmoothingValue(contacts);
}

public sealed class CurrentObserverAdapter : CurrentObserver
{
    public ExtremumDescription Classify(int x, int y) => ComputeExtremumType(PointCloud.AsJaggedArray(), x, y);
    public InteractionFrame Smooth(IList<Interaction> contacts) => ComputeSmoothingValue(contacts);
}

public static class ObserverComparisonSetup
{
    public static void Configure(IInteractionObserver observer)
    {
        var cloud = new PointCloud3(640, 480);
        foreach (var point in cloud.AsArray()) point.Z = 1.45f;
        for (var i = 0; i < 20; i++) cloud[40 + i * 28, 240].Z = i % 2 == 0 ? 1.3f : 1.6f;
        observer.PointCloud = cloud;
        observer.Distance = 1.45f;
        observer.ExtremumTypeCheckRadius = 12;
        observer.ExtremumTypeCheckNumSamples = 16;
        observer.ExtremumTypeCheckFittingPercentage = .75f;
        observer.InteractionHistorySize = 25;
        observer.NumSmoothingFrames = 25;
        observer.FilterType = FilterType.MovingAverage;
        observer.ContactRetentionSeconds = 1;
        observer.TouchMergeDistance2D = 64;
        observer.MaxConfidence = 30;
        observer.DepthScale = 100;
        observer.UseVelocityPrediction = false;
    }
}

[MemoryDiagnoser]
public class ObserverExtremumComparison
{
    private LegacyObserverAdapter _legacy = null!;
    private CurrentObserverAdapter _current = null!;

    [Params(ExtremumTypeCheckMethod.FixedRadius, ExtremumTypeCheckMethod.StochasticStatic,
        ExtremumTypeCheckMethod.StochasticDynamic)]
    public ExtremumTypeCheckMethod Sampling { get; set; }

    [GlobalSetup]
    public void Setup()
    {
        _legacy = new LegacyObserverAdapter();
        _current = new CurrentObserverAdapter();
        ObserverComparisonSetup.Configure(_legacy);
        ObserverComparisonSetup.Configure(_current);
        _legacy.ExtremumTypeCheckMethod = _current.ExtremumTypeCheckMethod = Sampling;
        for (var i = 0; i < 20; i++)
        {
            var expected = i % 2 == 0 ? ExtremumType.Minimum : ExtremumType.Maximum;
            if (_legacy.Classify(40 + i * 28, 240).Type != expected ||
                _current.Classify(40 + i * 28, 240).Type != expected)
                throw new InvalidOperationException("Classifier output differs from the reference scene.");
        }
    }

    [Benchmark(Baseline = true)]
    public int BenchmarkCopy()
    {
        var count = 0;
        for (var i = 0; i < 20; i++) count += _legacy.Classify(40 + i * 28, 240).NumFittingPoints;
        return count;
    }

    [Benchmark]
    public int Current()
    {
        var count = 0;
        for (var i = 0; i < 20; i++) count += _current.Classify(40 + i * 28, 240).NumFittingPoints;
        return count;
    }
}

[MemoryDiagnoser]
public class ObserverSmoothingComparison
{
    private LegacyObserverAdapter _legacy = null!;
    private CurrentObserverAdapter _current = null!;
    private List<Interaction> _contacts = null!;

    [GlobalSetup]
    public void Setup()
    {
        _legacy = new LegacyObserverAdapter();
        _current = new CurrentObserverAdapter();
        ObserverComparisonSetup.Configure(_legacy);
        ObserverComparisonSetup.Configure(_current);
        _contacts = Enumerable.Range(0, 20).Select(i => new Interaction
        {
            Position = new Point3(40 + i * 28, 240, -.5f),
            Type = InteractionType.Push,
            Confidence = 10
        }).ToList();
        for (var i = 0; i < 25; i++)
        {
            _legacy.Smooth(_contacts);
            _current.Smooth(_contacts);
        }
    }

    [Benchmark(Baseline = true)]
    public InteractionFrame BenchmarkCopy() => _legacy.Smooth(_contacts);

    [Benchmark]
    public InteractionFrame Current() => _current.Smooth(_contacts);
}
