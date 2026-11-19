using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Util;

namespace InteractionTests;

public class TrackingConcurrencyTest
{
    private sealed class Observer : InteractionObserverBase
    {
        public Action AtTrackingStage;
        public double Now = 1;
        public override ObserverType Type => ObserverType.MultiTouch;
        public override PointCloud3 PointCloud { get; set; } = new(3, 3);
        public override VectorField2 VectorField { get; set; } = new(3, 3);
        protected override double GetTimestampSeconds() => Now;
        protected override Task<Tuple<IEnumerable<Interaction>, ProcessPerformance>> Analyze(ProcessPerformance performance)
            => Task.FromResult(Tuple.Create<IEnumerable<Interaction>, ProcessPerformance>(
                new[] { new Interaction(new Point3(1, 1, .75f), InteractionType.Push, 1) }, performance));
        protected override IList<Interaction> ConsolidateExtrema(IList<Interaction> interactions)
        {
            AtTrackingStage?.Invoke();
            return base.ConsolidateExtrema(interactions);
        }
    }

    [TestCase("history")]
    [TestCase("smoothing")]
    [TestCase("filter")]
    [TestCase("prediction")]
    [TestCase("assignment")]
    public async Task ConfigurationWaitsUntilTheTrackingFrameHasBeenPublished(string setting)
    {
        var observer = new Observer
        {
            Distance = 1, MinDistance = .1f, MaxDistance = .5f, MinConfidence = 0,
            MaxConfidence = 30, InteractionHistorySize = 4, NumSmoothingFrames = 2,
            UseVelocityPrediction = true, ExtremumTypeCheckMethod = ExtremumTypeCheckMethod.Global
        };
        observer.PointCloud[1, 1].Z = .75f;
        IList<InteractionVelocity> diagnostics = null;
        IList<Interaction> published = null;
        observer.NewVelocities += (_, values) => diagnostics = values;
        observer.NewInteractions += (_, values) => published = values;
        await observer.Update();
        var originalId = published.Single().TouchId;

        using var entered = new ManualResetEventSlim();
        using var release = new ManualResetEventSlim();
        using var writerStarted = new ManualResetEventSlim();
        using var writerFinished = new ManualResetEventSlim();
        observer.AtTrackingStage = () =>
        {
            entered.Set();
            if (!release.Wait(TimeSpan.FromSeconds(5))) throw new TimeoutException("Frame was not released.");
        };
        observer.Now = 1.01;
        var frame = Task.Run(() => observer.Update());
        Exception writerError = null;
        var writer = new Thread(() =>
        {
            writerStarted.Set();
            try
            {
                switch (setting)
                {
                    case "history": observer.InteractionHistorySize = 0; break;
                    case "smoothing": observer.NumSmoothingFrames = 3; break;
                    case "filter": observer.FilterType = FilterType.Butterworth; break;
                    case "prediction": observer.UseVelocityPrediction = false; break;
                    case "assignment": observer.AssignmentBirthCost = .25f; break;
                }
            }
            catch (Exception error) { writerError = error; }
            finally { writerFinished.Set(); }
        });
        try
        {
            Assert.That(entered.Wait(TimeSpan.FromSeconds(5)), Is.True);
            writer.Start();
            Assert.That(writerStarted.Wait(TimeSpan.FromSeconds(5)), Is.True);
            Assert.That(writerFinished.Wait(TimeSpan.FromMilliseconds(150)), Is.False,
                "A settings write must wait while the frame owns the tracking state.");
        }
        finally
        {
            release.Set();
            await frame.WaitAsync(TimeSpan.FromSeconds(5));
            if (writer.ThreadState != ThreadState.Unstarted)
                Assert.That(writer.Join(TimeSpan.FromSeconds(5)), Is.True);
        }
        Assert.That(writerError, Is.Null);
        Assert.That(diagnostics, Has.Count.EqualTo(1), "The in-flight frame keeps its prediction configuration.");
        Assert.That(diagnostics.Single().TouchId, Is.EqualTo(originalId));
        Assert.That(published.Single().TouchId, Is.EqualTo(originalId));

        observer.AtTrackingStage = null;
        observer.Now = 1.02;
        await observer.Update();
        if (setting == "history")
        {
            Assert.That(published.Single().TouchId, Is.Not.EqualTo(originalId));
            observer.InteractionHistorySize = 4;
            observer.Now = 1.03;
            await observer.Update();
            Assert.That(published, Has.Count.EqualTo(1));
        }
        if (setting == "prediction") Assert.That(diagnostics, Is.Empty);
        if (setting == "smoothing") Assert.That(observer.NumSmoothingFrames, Is.EqualTo(3));
        if (setting == "filter") Assert.That(observer.FilterType, Is.EqualTo(FilterType.Butterworth));
        if (setting == "assignment") Assert.That(observer.AssignmentBirthCost, Is.EqualTo(.25f));
    }
}
