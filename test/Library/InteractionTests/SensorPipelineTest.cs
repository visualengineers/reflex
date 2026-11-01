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

/// <summary>Integration scenarios from completed sensor pairs to manager publication/diagnostics.
/// The shared clock is explicit; a TaskCompletionSource models remote latency without sleeping.</summary>
public class SensorPipelineTest
{
    private sealed class Clock { public double Now = 10; }
    private sealed class Remote(Service service, Clock clock) : RemoteInteractionProcessor(service)
    {
        protected override double GetTimestampSeconds() => clock.Now;
    }
    private sealed class Manager(Depth depth, Service service, Clock clock)
        : InteractionManager(depth, service, new Performance())
    {
        protected override double GetTimestampSeconds() => clock.Now;
        protected override IInteractionObserver CreateObserver(ObserverType type) => new Remote(service, clock);
    }
    private sealed class Scene : IDisposable
    {
        public Clock Clock = new();
        public Depth Depth = new();
        public Service Service = new();
        public Manager Manager;
        public IList<InteractionVelocity> Diagnostics = new List<InteractionVelocity>();
        public Scene()
        {
            Manager = new Manager(Depth, Service, Clock)
            {
                Distance = 1, MinDistance = .125f, MaxDistance = .5f,
                MaxConfidence = 100, MinConfidence = 0, InteractionHistorySize = 4,
                NumSmoothingFrames = 0, ContactRetentionSeconds = .25,
                UseVelocityPrediction = true, TouchMergeDistance2D = 64,
                ExtremumTypeCheckMethod = ExtremumTypeCheckMethod.Global,
                ExtremumTypeCheckNumSamples = 8, ExtremumTypeCheckRadius = 2
            };
            Manager.Type = ObserverType.Remote;
            Manager.VelocitiesUpdated += (_, items) => Diagnostics = items;
        }
        public TrackingObservation Emit(long sequence)
        {
            var observation = new TrackingObservation(sequence, Clock.Now, Depth.PointCloud, Depth.VectorField);
            Depth.Emit(observation);
            return observation;
        }
        public void Dispose() => Manager.Dispose();
    }

    [Test]
    public async Task DuplicateSensorFramesNeverConfirmAndTimerTicksExpirePublication()
    {
        using var scene = new Scene();
        var first = scene.Emit(1);
        await scene.Manager.Update();
        var id = scene.Manager.Interactions.Single().TouchId;
        scene.Clock.Now = 10.1;
        scene.Depth.Emit(first);
        Assert.That(await scene.Manager.Update(), Is.EqualTo(ProcessServiceStatus.Skipped));
        Assert.That(scene.Service.Calls, Is.EqualTo(1));
        Assert.That(scene.Manager.Interactions.Single().Confidence, Is.EqualTo(7).Within(.0001));
        scene.Clock.Now = 10.26;
        await scene.Manager.Update();
        Assert.That(scene.Manager.Interactions, Is.Empty);
        Assert.That(scene.Diagnostics, Is.Empty);
        scene.Clock.Now = 10.27;
        scene.Emit(2);
        await scene.Manager.Update();
        Assert.That(scene.Manager.Interactions.Single().TouchId, Is.Not.EqualTo(id));
    }

    [Test]
    public async Task RemoteSnapshotSurvivesNewRasterAndRejectsLateResult()
    {
        using var scene = new Scene();
        var completion = new TaskCompletionSource<bool>();
        scene.Service.Wait = completion.Task;
        var first = scene.Emit(1);
        var processing = scene.Manager.Update();
        // Change both the source point and vector validity while remote processing is awaiting.
        scene.Depth.PointCloud[10, 10].Z = 1.25f;
        scene.Depth.VectorField[10, 10].IsValid = false;
        scene.Clock.Now = 10.05;
        scene.Emit(2);
        completion.SetResult(true);
        await processing;
        Assert.That(scene.Manager.Interactions.Single().Type, Is.EqualTo(InteractionType.Push));
        Assert.That(scene.Service.Received[10, 10].Z, Is.EqualTo(.75f));
        Assert.That(first.VectorField[10, 10].IsValid, Is.True);

        scene.Service.Wait = Task.CompletedTask;
        scene.Clock.Now = 10.5;
        await scene.Manager.Update(); // Pending observation at 10.05 is too old at publication.
        Assert.That(scene.Manager.Interactions, Is.Empty);
    }

    [Test]
    public async Task InFlightRemoteRequestDoesNotBlockExpiryOrReviveLateContacts()
    {
        using var scene = new Scene();
        scene.Emit(1);
        await scene.Manager.Update();
        var completion = new TaskCompletionSource<bool>();
        scene.Service.Wait = completion.Task;
        scene.Clock.Now = 10.05;
        scene.Emit(2);
        var pending = scene.Manager.Update();
        scene.Clock.Now = 10.4;
        scene.Manager.AdvanceTime();
        Assert.That(scene.Manager.Interactions, Is.Empty);
        Assert.That(scene.Diagnostics, Is.Empty);
        completion.SetResult(true);
        await pending;
        Assert.That(scene.Manager.Interactions, Is.Empty);
    }

    [Test]
    public async Task TimerBroadcastsExpiryWhileRemoteRequestIsInFlight()
    {
        using var scene = new Scene();
        scene.Emit(1);
        await scene.Manager.Update();
        var completion = new TaskCompletionSource<bool>();
        scene.Service.Wait = completion.Task;
        scene.Clock.Now = 10.05;
        scene.Emit(2);
        var network = new Network();
        var loop = new TimerLoop(network, scene.Manager, null);
        var tick = typeof(TimerLoop).GetMethod("OnTimerTick", System.Reflection.BindingFlags.Instance |
            System.Reflection.BindingFlags.NonPublic);
        tick.Invoke(loop, new object[] { null, EventArgs.Empty });
        scene.Clock.Now = 10.4;
        tick.Invoke(loop, new object[] { null, EventArgs.Empty });
        Assert.That(network.Published, Is.Empty);
        Assert.That(network.Calls, Is.EqualTo(1));
        completion.SetResult(true);
        await network.SecondBroadcast.Task.WaitAsync(TimeSpan.FromSeconds(5));
        Assert.That(network.Published, Is.Empty, "The late response must not revive a network contact.");
    }

    [TestCase(false)]
    [TestCase(true)]
    public async Task FailedOrBusyRemoteStillExpiresOldContactsAndRecovers(bool busy)
    {
        using var scene = new Scene();
        scene.Emit(1);
        await scene.Manager.Update();
        scene.Clock.Now = 10.3;
        scene.Service.IsBusy = busy;
        scene.Service.Fail = !busy;
        scene.Emit(2);
        await scene.Manager.Update();
        Assert.That(scene.Manager.Interactions, Is.Empty);
        Assert.That(scene.Diagnostics, Is.Empty);
        scene.Service.IsBusy = false;
        scene.Service.Fail = false;
        scene.Clock.Now = 10.4;
        scene.Emit(3);
        await scene.Manager.Update();
        Assert.That(scene.Manager.Interactions, Has.Count.EqualTo(1));
    }

    [Test]
    public async Task DiagnosticsExplainConfidenceAndClusterSuppression()
    {
        using var scene = new Scene();
        scene.Manager.MinConfidence = 20;
        scene.Emit(1);
        await scene.Manager.Update();
        Assert.That(scene.Manager.Interactions, Is.Empty);
        Assert.That(scene.Diagnostics.Single().SuppressionReason, Is.EqualTo("confidence"));
        Assert.That(scene.Diagnostics.Single().IsPublished, Is.False);

        scene.Manager.MinConfidence = 0;
        scene.Manager.TouchMergeDistance2D = 1;
        scene.Manager.InputDistance = 10;
        scene.Clock.Now = 10.01;
        scene.Service.X = 12;
        scene.Depth.PointCloud[12, 10].Z = .75f;
        scene.Emit(2);
        await scene.Manager.Update();
        Assert.That(scene.Manager.Interactions.Single().TrackingState, Is.Not.EqualTo(InteractionTrackingState.Lost));
        Assert.That(scene.Diagnostics.Single(item => item.IsPredicted).SuppressionReason, Is.EqualTo("cluster"));
        Assert.That(scene.Diagnostics.Single(item => !item.IsPredicted).IsPublished, Is.True);
    }

    private sealed class Service : IRemoteInteractionProcessorService
    {
        public bool IsConnected => true;
        public bool IsBusy { get; set; }
        public bool SendCompleteDataset { get; set; }
        public bool Fail;
        public int Calls;
        public int X = 10;
        public Task Wait = Task.CompletedTask;
        public PointCloud3 Received;
        public Task<bool> Connect() => Task.FromResult(true);
        public Task<bool> Disconnect() => Task.FromResult(true);
        public async Task<Tuple<IEnumerable<Interaction>, ProcessPerformance>> Update(PointCloud3 cloud,
            float zeroPlane, ProcessPerformance performance, bool measurePerformance)
        {
            Calls++;
            if (Fail) throw new InvalidOperationException("simulated transport failure");
            // Keep the actual passed cloud so the test detects mutations, not a copy made by this service.
            var depth = cloud[X, 10].Z;
            await Wait;
            Received = cloud;
            return Tuple.Create<IEnumerable<Interaction>, ProcessPerformance>(new[]
            { new Interaction(new Point3(X, 10, depth), InteractionType.Push, 10) }, performance);
        }
    }
    private sealed class Network : INetworkManager
    {
        public ReFlex.Core.Networking.Util.NetworkInterface Type { get; set; }
        public string ServerAddress => "test";
        public string Address { get; set; }
        public string Endpoint { get; set; }
        public int Port { get; set; }
        public bool IsRunning => true;
        public int Calls;
        public ICollection<Interaction> Published;
        public TaskCompletionSource<bool> SecondBroadcast = new();
        public void Run() { }
        public void Stop() { }
        public void Broadcast(ICollection<Interaction> interactions)
        {
            Published = interactions;
            if (++Calls == 2) SecondBroadcast.SetResult(true);
        }
    }

    private sealed class Performance : IPerformanceAggregator
    {
        public bool MeasurePerformance { get; set; }
        public event EventHandler<PerformanceData> PerformanceDataUpdated { add { } remove { } }
        public void RegisterReporter(IPerformanceReporter reporter) { }
        public void UnregisterReporter(IPerformanceReporter reporter) { }
    }
    private sealed class Depth : IDepthImageManager
    {
        public PointCloud3 PointCloud { get; } = new(30, 30);
        public VectorField2 VectorField { get; } = new(30, 30);
        public Depth()
        {
            foreach (var point in PointCloud.AsArray()) point.Z = 1;
            PointCloud[10, 10].Z = .75f;
        }
        public event EventHandler<TrackingObservation> ObservationReady;
        public void Emit(TrackingObservation observation) => ObservationReady?.Invoke(this, observation);
        public int ImageWidth => 30;
        public int ImageHeight => 30;
        public event EventHandler<PointCloud3> PointcloudFiltered { add { } remove { } }
        public event EventHandler<VectorField2> VectorfieldChanged { add { } remove { } }
        public event EventHandler<ImageByteArray> DepthImageChanged { add { } remove { } }
        public event EventHandler<DepthCameraFrame> RawDepthFrameReceived { add { } remove { } }
        public void Initialize(int sizeX, int sizeY) { }
        public void Update(DepthCameraFrame frame) { }
        public void Update(ImageByteArray depthImage) { }
    }
}
