using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Interfaces;
using ReFlex.Core.Interactivity.Util;

namespace InteractionTests;

public class ObserverPipelineTest
{
    private static PointCloud3 Cloud()
    {
        var cloud = new PointCloud3(50, 30);
        foreach (var p in cloud.AsArray()) p.Z = 1;
        cloud[10, 10].Z = .75f;
        cloud[35, 10].Z = 1.25f;
        return cloud;
    }

    private static void Configure(InteractionObserverBase observer)
    {
        observer.PointCloud = Cloud();
        observer.Distance = 1;
        observer.MinDistance = .125f;
        observer.MaxDistance = .5f;
        observer.MinConfidence = 0;
        observer.MaxConfidence = 10;
        observer.InteractionHistorySize = 4;
        observer.NumSmoothingFrames = 0;
        observer.FilterType = FilterType.None;
        observer.TouchMergeDistance2D = 16;
        observer.ExtremumTypeCheckRadius = 2;
        observer.ExtremumTypeCheckNumSamples = 8;
        observer.ExtremumTypeCheckFittingPercentage = .75f;
        observer.ExtremumTypeCheckMethod = ExtremumTypeCheckMethod.FixedRadius;
    }

    private sealed class Service : IRemoteInteractionProcessorService
    {
        public bool IsConnected { get; set; } = true;
        public bool IsBusy { get; set; }
        public bool ConnectSucceeds { get; set; } = true;
        public bool SendCompleteDataset { get; set; }
        public int Calls { get; private set; }
        public int ConnectCalls { get; private set; }
        public Func<IEnumerable<Interaction>> Candidates { get; set; } = () => new[]
        {
            new Interaction { Position = new Point3(10, 10, .75f), Confidence = 1 }
        };
        public Task<bool> Connect() { ConnectCalls++; IsConnected = ConnectSucceeds; return Task.FromResult(IsConnected); }
        public Task<bool> Disconnect() { IsConnected = false; return Task.FromResult(false); }
        public Task<Tuple<IEnumerable<Interaction>, ProcessPerformance>> Update(PointCloud3 cloud, float zeroPlane,
            ProcessPerformance performance, bool measurePerformance)
        {
            Calls++;
            Assert.That(zeroPlane, Is.EqualTo(1));
            return Task.FromResult(Tuple.Create(Candidates(), performance));
        }
    }

    [Test]
    public async Task RemoteConfidenceAndEventsFollowTheSharedPipeline()
    {
        var service = new Service();
        var observer = new RemoteInteractionProcessor(service);
        Configure(observer);
        observer.MinConfidence = 2;
        var publications = new List<IList<Interaction>>();
        observer.NewInteractions += (_, data) => publications.Add(data);
        for (var i = 0; i < 3; i++)
            Assert.That((await observer.Update()).ServiceStatus, Is.EqualTo(ProcessServiceStatus.Available));
        Assert.That(publications.Count, Is.EqualTo(3));
        Assert.That(publications[0], Is.Empty);
        Assert.That(publications[1], Is.Empty);
        Assert.That(publications[2], Has.Count.EqualTo(1));
        Assert.That(publications[2][0].Confidence, Is.EqualTo(3));
        Assert.That(publications[2][0].ExtremumDescription.Type, Is.EqualTo(ExtremumType.Minimum));
        Assert.That(service.Calls, Is.EqualTo(3));
    }

    [Test]
    public async Task OppositeExtremaAreRemovedBeforeHistory()
    {
        var service = new Service
        {
            Candidates = () => new[]
            {
                new Interaction { Position = new Point3(10,10,.75f), Confidence = 1 },
                new Interaction { Position = new Point3(35,10,.75f), Confidence = 1 }
            }
        };
        var observer = new RemoteInteractionProcessor(service);
        Configure(observer);
        // A local maximum on the push side is an intermediate extremum, not a touch.
        foreach (var p in observer.PointCloud.AsArray()) p.Z = .5f;
        observer.PointCloud[10,10].Z = .25f;
        observer.PointCloud[35,10].Z = .75f;
        IList<Interaction> published = null;
        observer.NewInteractions += (_, data) => published = data;
        observer.InteractionHistoryUpdated += (_, history) =>
            Assert.That(history.SelectMany(f => f.Interactions).All(i => i.Position.X == 10), Is.True);
        await observer.Update();
        Assert.That(published, Has.Count.EqualTo(1));
        Assert.That(published[0].Position.X, Is.EqualTo(10));
    }

    [Test]
    public async Task SingleTouchCanPublishDistinctHistoricalIds()
    {
        var observer = new SingleInteractionObserver();
        Configure(observer);
        IList<Interaction> published = null;
        var count = 0;
        observer.NewInteractions += (_, data) => { published = data; count++; };
        observer.PointCloud[35,10].Z = 1;
        await observer.Update();
        Assert.That(published, Has.Count.EqualTo(1));
        observer.PointCloud[10,10].Z = 1;
        observer.PointCloud[35,10].Z = 1.25f;
        await observer.Update();
        Assert.That(count, Is.EqualTo(2));
        Assert.That(published, Has.Count.EqualTo(2));
        Assert.That(published.Select(i => i.TouchId).Distinct().Count(), Is.EqualTo(2));
        Assert.That(published.Select(i => i.Type), Is.EquivalentTo(new[] { InteractionType.Push, InteractionType.Pull }));
    }

    [TestCase(false, true, true, ProcessServiceStatus.Error)]
    [TestCase(true, true, true, ProcessServiceStatus.Skipped)]
    [TestCase(true, false, false, ProcessServiceStatus.Error)]
    public async Task RemoteFailureAndBusyStatesDoNotAnalyzeOrPublish(bool cloud, bool busy, bool connects, ProcessServiceStatus expected)
    {
        var service = new Service { IsBusy = busy, IsConnected = false, ConnectSucceeds = connects };
        var observer = new RemoteInteractionProcessor(service);
        Configure(observer);
        if (!cloud) observer.PointCloud = null;
        var events = 0;
        observer.NewInteractions += (_, _) => events++;
        Assert.That((await observer.Update()).ServiceStatus, Is.EqualTo(expected));
        Assert.That(service.Calls, Is.Zero);
        Assert.That(events, Is.Zero);
        if (!cloud || busy) Assert.That(service.ConnectCalls, Is.Zero);
    }

    [Test]
    public async Task NoObserverAndMissingLocalInputsDoNotPublish()
    {
        foreach (var observer in new InteractionObserverBase[]
                 { new NoInteractionObserver(), new SingleInteractionObserver(), new MultiInteractionObserver() })
        {
            var events = 0;
            observer.NewInteractions += (_, _) => events++;
            var result = await observer.Update();
            Assert.That(result.ServiceStatus, Is.EqualTo(observer is NoInteractionObserver
                ? ProcessServiceStatus.Skipped : ProcessServiceStatus.Error));
            Assert.That(events, Is.Zero);
        }
    }

    private sealed class Conversion : SingleInteractionObserver
    {
        public List<Interaction> Convert(params float[] depths) => ConvertDepthValue(depths.Select(z =>
            new Interaction { Position = new Point3(10, 10, z) }).ToList());
    }

    [Test]
    public void SharedConversionRejectsInclusiveDeadZoneAndNonFiniteValues()
    {
        var observer = new Conversion();
        Configure(observer);
        Assert.That(observer.Convert(.875f, 1, 1.125f, float.NaN, float.PositiveInfinity, float.NegativeInfinity), Is.Empty);
        var result = observer.Convert(.75f, 1.25f);
        Assert.That(result.Select(i => i.Type), Is.EqualTo(new[] { InteractionType.Push, InteractionType.Pull }));
        Assert.That(result.Select(i => i.Position.Z), Is.EqualTo(new[] { -1f/3, 1f/3 }));
    }
}
