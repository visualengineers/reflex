using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Implementation.Components;
using Implementation.Interfaces;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Interfaces;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Interfaces;
using ReFlex.Core.Interactivity.Util;
using ReFlex.Core.Tracking.Util;

namespace InteractionTests;

public class ExtremumClassificationTest
{
    private static PointCloud3 Scene(int pushX = 20)
    {
        var cloud = new PointCloud3(80, 40);
        foreach (var point in cloud.AsArray()) point.Z = 1.45f;
        cloud[pushX, 20].Z = 1.3f;
        cloud[60, 20].Z = 1.6f;
        return cloud;
    }

    private static void Configure(InteractionObserverBase observer, ExtremumTypeCheckMethod method)
    {
        observer.Distance = 1.45f;
        observer.MinDistance = .01f;
        observer.MaxDistance = .25f;
        observer.ExtremumTypeCheckRadius = 2;
        observer.ExtremumTypeCheckNumSamples = 8;
        observer.ExtremumTypeCheckFittingPercentage = .75f;
        observer.ExtremumTypeCheckMethod = method;
        observer.InteractionHistorySize = 2;
        observer.NumSmoothingFrames = 2;
        observer.TouchMergeDistance2D = 64;
        observer.MaxConfidence = 20;
        observer.FilterType = FilterType.MovingAverage;
    }

    private sealed class MultiClassifier : MultiInteractionObserver
    {
        public ExtremumDescription Classify(int x, int y) => ComputeExtremumType(PointCloud.AsJaggedArray(), x, y);
    }

    private sealed class Service : IRemoteInteractionProcessorService
    {
        public int PushX { get; set; } = 20;
        public bool IsConnected => true;
        public bool IsBusy => false;
        public bool SendCompleteDataset { get; set; }
        public Task<bool> Connect() => Task.FromResult(true);
        public Task<bool> Disconnect() => Task.FromResult(false);
        public Task<Tuple<IList<Interaction>, ProcessPerformance>> Update(PointCloud3 cloud, float zeroPlane,
            ProcessPerformance measurement, bool measurePerformance)
        {
            IList<Interaction> candidates = new List<Interaction>
            {
                new() { Position = new Point3(PushX, 20, cloud[PushX, 20].Z), Confidence = 1 },
                new() { Position = new Point3(60, 20, cloud[60, 20].Z), Confidence = 1 }
            };
            return Task.FromResult(Tuple.Create(candidates, measurement));
        }
    }

    [TestCase(ExtremumTypeCheckMethod.Global)]
    [TestCase(ExtremumTypeCheckMethod.FixedRadius)]
    public async Task RemoteMatchesMultiTouchBeforeAndAfterPositionSmoothing(ExtremumTypeCheckMethod method)
    {
        var service = new Service();
        var remote = new RemoteInteractionProcessor(service);
        var multi = new MultiClassifier();
        Configure(remote, method);
        Configure(multi, method);
        IList<Interaction> published = null;
        remote.NewInteractions += (_, interactions) => published = interactions;
        remote.InteractionHistoryUpdated += (_, frames) =>
        {
            foreach (var interaction in frames.SelectMany(frame => frame.Interactions))
                Assert.That(interaction.ExtremumDescription.Type,
                    Is.EqualTo(interaction.Type == InteractionType.Push ? ExtremumType.Minimum : ExtremumType.Maximum));
        };

        foreach (var pushX in new[] { 20, 24 })
        {
            service.PushX = pushX;
            remote.PointCloud = multi.PointCloud = Scene(pushX);
            await remote.Update();
            Assert.That(published, Has.Count.EqualTo(2));
            var push = published.Single(i => i.Type == InteractionType.Push);
            var pull = published.Single(i => i.Type == InteractionType.Pull);
            Assert.That(push.ExtremumDescription.Type, Is.EqualTo(ExtremumType.Minimum));
            Assert.That(pull.ExtremumDescription.Type, Is.EqualTo(ExtremumType.Maximum));
            Assert.That(push.ExtremumDescription.Type, Is.EqualTo(multi.Classify(pushX, 20).Type));
            Assert.That(pull.ExtremumDescription.Type, Is.EqualTo(multi.Classify(60, 20).Type));
            // Ensure this actually exercises a smoothed position away from the current extremum.
            if (pushX == 24) Assert.That(push.Position.X, Is.LessThan(pushX));
        }
    }

    [Test]
    public void GlobalDoesNotInventExtremaOnTheZeroPlaneOrAtInvalidDepth()
    {
        var multi = new MultiClassifier { PointCloud = Scene() };
        Configure(multi, ExtremumTypeCheckMethod.Global);
        Assert.That(multi.Classify(0, 0).Type, Is.EqualTo(ExtremumType.Undefined));
        multi.PointCloud[0, 0].Z = float.NaN;
        Assert.That(multi.Classify(0, 0).Type, Is.EqualTo(ExtremumType.Undefined));
    }

    [Test]
    public void ObserverSwitchPreservesExtremumSettingsIncludingSettingsAppliedBeforeInitialisation()
    {
        var performance = new Performance();
        using var manager = new InteractionManager(new Depth(), new Service(), performance);
        manager.ExtremumTypeCheckRadius = 6;
        manager.ExtremumTypeCheckNumSamples = 12;
        manager.ExtremumTypeCheckFittingPercentage = .8f;
        manager.ExtremumTypeCheckMethod = ExtremumTypeCheckMethod.FixedRadius;
        foreach (var type in new[] { ObserverType.MultiTouch, ObserverType.Remote, ObserverType.MultiTouch })
        {
            manager.Type = type;
            var observer = (InteractionObserverBase)performance.Current;
            Assert.That(observer.ExtremumTypeCheckMethod, Is.EqualTo(ExtremumTypeCheckMethod.FixedRadius));
            Assert.That(observer.ExtremumTypeCheckRadius, Is.EqualTo(6));
            Assert.That(observer.ExtremumTypeCheckNumSamples, Is.EqualTo(12));
            Assert.That(observer.ExtremumTypeCheckFittingPercentage, Is.EqualTo(.8f));
        }
        manager.ExtremumTypeCheckMethod = ExtremumTypeCheckMethod.StochasticStatic;
        manager.ExtremumTypeCheckRadius = 8;
        manager.ExtremumTypeCheckNumSamples = 16;
        manager.ExtremumTypeCheckFittingPercentage = .9f;
        manager.Type = ObserverType.Remote;
        Assert.That(manager.ExtremumTypeCheckMethod, Is.EqualTo(ExtremumTypeCheckMethod.StochasticStatic));
        Assert.That(manager.ExtremumTypeCheckRadius, Is.EqualTo(8));
        Assert.That(manager.ExtremumTypeCheckNumSamples, Is.EqualTo(16));
        Assert.That(manager.ExtremumTypeCheckFittingPercentage, Is.EqualTo(.9f));
    }

    private sealed class Performance : IPerformanceAggregator
    {
        public IPerformanceReporter Current { get; private set; }
        public event EventHandler<PerformanceData> PerformanceDataUpdated { add { } remove { } }
        public bool MeasurePerformance { get; set; }
        public void RegisterReporter(IPerformanceReporter reporter) => Current = reporter;
        public void UnregisterReporter(IPerformanceReporter reporter) { }
    }

    private sealed class Depth : IDepthImageManager
    {
        public PointCloud3 PointCloud { get; } = Scene();
        public VectorField2 VectorField => null;
        public int ImageWidth => 80;
        public int ImageHeight => 40;
        public event EventHandler<PointCloud3> PointcloudFiltered { add { } remove { } }
        public event EventHandler<VectorField2> VectorfieldChanged { add { } remove { } }
        public event EventHandler<ImageByteArray> DepthImageChanged { add { } remove { } }
        public event EventHandler<DepthCameraFrame> RawDepthFrameReceived { add { } remove { } }
        public void Initialize(int sizeX, int sizeY) { }
        public void Update(DepthCameraFrame frame) { }
        public void Update(ImageByteArray depthImage) { }
    }
}
