using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Server.Data.Config;

namespace InteractionTests;

public class ExtremumConsolidationTest
{
    private static Interaction Peak(float x, float y = 10, float depth = -.5f, float confidence = 1)
        => new(new Point3(x, y, depth), depth < 0 ? InteractionType.Push : InteractionType.Pull, confidence);

    [Test]
    public void AdjacentPeaksBecomeOneMeasurementWithoutMultiplyingConfidenceOrWeakeningDepth()
    {
        var input = new[] { Peak(10, depth: -.75f, confidence: 2), Peak(12, depth: -.25f, confidence: 3) };
        var output = ExtremumConsolidator.Consolidate(input, 3).Single();
        Assert.Multiple(() =>
        {
            Assert.That(output.Position.X, Is.EqualTo(10.5));
            Assert.That(output.Position.Z, Is.EqualTo(-.75));
            Assert.That(output.Confidence, Is.EqualTo(3));
            Assert.That(input[0].Position.X, Is.EqualTo(10));
            Assert.That(input[0].Confidence, Is.EqualTo(2));
        });
        output.Position.X = 99;
        Assert.That(input[0].Position.X, Is.EqualTo(10));
    }

    [Test]
    public void RadiusUsesEuclideanPixelsAndKeepsNearbySeparateFingersAndOppositePressureTypes()
    {
        var output = ExtremumConsolidator.Consolidate(new[] {
            Peak(10), Peak(12, 12), Peak(18), Peak(10, depth: .5f)
        }, 3);
        Assert.That(output, Has.Count.EqualTo(3));
        Assert.That(output.Count(i => i.Type == InteractionType.Push), Is.EqualTo(2));
        Assert.That(output.Single(i => i.Type == InteractionType.Pull).Position.X, Is.EqualTo(10));
        Assert.That(ExtremumConsolidator.Consolidate(new[] { Peak(10), Peak(13,11) }, 3), Has.Count.EqualTo(2));
    }

    [Test]
    public void WeakBridgesCannotTransitivelyJoinDistinctPeaksAndOrderingIsDeterministic()
    {
        var input = new[] { Peak(10, depth: -.9f), Peak(13, depth: -.8f), Peak(16, depth: -.7f) };
        var forward = ExtremumConsolidator.Consolidate(input, 3);
        var reversed = ExtremumConsolidator.Consolidate(input.Reverse().ToArray(), 3);
        Assert.That(forward, Has.Count.EqualTo(2));
        Assert.That(reversed.Select(i => i.Position.X), Is.EqualTo(forward.Select(i => i.Position.X)));
    }

    [Test]
    public void LegacyConfigurationDefaultsToSmallRadiusAndZeroExplicitlyDisablesConsolidation()
    {
        var old = JsonConvert.DeserializeObject<ExtremumDescriptionSettings>("{\"CheckRadius\":15}");
        var disabled = JsonConvert.DeserializeObject<ExtremumDescriptionSettings>("{\"MergeRadius\":0}");
        Assert.That(old.MergeRadius, Is.EqualTo(3));
        Assert.That(disabled.MergeRadius, Is.Zero);
        Assert.That(JsonConvert.DeserializeObject<ExtremumDescriptionSettings>(JsonConvert.SerializeObject(disabled)).MergeRadius, Is.Zero);
        Assert.That(ExtremumConsolidator.Consolidate(new[] { Peak(10), Peak(11) }, 0), Has.Count.EqualTo(2));
    }

    [TestCase(-1f)]
    [TestCase(float.NaN)]
    [TestCase(float.PositiveInfinity)]
    [TestCase(33f)]
    public void InvalidRadiusIsRejectedBeforeChangingConfiguration(float radius)
    {
        var observer = new ScriptedObserver();
        Assert.Throws<ArgumentOutOfRangeException>(() => observer.ExtremumMergeRadius = radius);
        Assert.That(observer.ExtremumMergeRadius, Is.EqualTo(3));
        Assert.Throws<ArgumentOutOfRangeException>(() => ExtremumConsolidator.Consolidate(new[] { Peak(10) }, radius));
        var settings = new ExtremumDescriptionSettings();
        Assert.Throws<ArgumentOutOfRangeException>(() => settings.MergeRadius = radius);
    }

    private sealed class ScriptedObserver : InteractionObserverBase
    {
        public double Now;
        public IList<Interaction> Candidates = new List<Interaction>();
        public override ObserverType Type => ObserverType.MultiTouch;
        public override PointCloud3 PointCloud { get; set; } = new(100, 30);
        public override VectorField2 VectorField { get; set; }
        protected override double GetTimestampSeconds() => Now;
        protected override Task<Tuple<IEnumerable<Interaction>, ProcessPerformance>> Analyze(ProcessPerformance performance)
            => Task.FromResult(Tuple.Create(Candidates.Select(i => new Interaction(i)), performance));
    }

    [Test]
    public async Task AlternatingSingleAndDoubleExtremaKeepOneIdInHistoryAndOutputWhileSecondFingerStaysDistinct()
    {
        var observer = new ScriptedObserver { Distance = 1, MinDistance = .05f, MaxDistance = .5f,
            MaxConfidence = 30, MinConfidence = 0, InteractionHistorySize = 15, NumSmoothingFrames = 0,
            UseVelocityPrediction = true, TouchMergeDistance2D = 81,
            ExtremumTypeCheckMethod = ExtremumTypeCheckMethod.Global };
        foreach (var p in observer.PointCloud.AsArray()) p.Z = .7f;
        IList<Interaction> published = null;
        observer.NewInteractions += (_, items) => published = items;
        observer.InteractionHistoryUpdated += (_, history) =>
            Assert.That(history.All(f => f.Interactions.Count == 2), Is.True, "Duplicates must be removed before track history.");
        int? movingId = null, secondId = null;
        for (var frame = 0; frame < 30; frame++)
        {
            observer.Now = 100 + frame / 30d;
            var x = 10 + (frame < 15 ? frame : 30 - frame); // reversal
            observer.Candidates = new List<Interaction> { new(new Point3(x,10,.7f), InteractionType.None, 1),
                new(new Point3(75,10,.7f), InteractionType.None, 1) };
            if (frame % 3 != 1) observer.Candidates.Add(new Interaction(new Point3(x+1,10,.7f), InteractionType.None, 1));
            if (frame % 2 == 0) observer.Candidates = observer.Candidates.Reverse().ToList();
            await observer.Update();
            Assert.That(published, Has.Count.EqualTo(2));
            var moving = published.MinBy(i => i.Position.X);
            var second = published.MaxBy(i => i.Position.X);
            movingId ??= moving.TouchId; secondId ??= second.TouchId;
            Assert.That(moving.TouchId, Is.EqualTo(movingId));
            Assert.That(second.TouchId, Is.EqualTo(secondId));
        }
    }

    [Test]
    public async Task ConsolidationPrecedesTwentyCandidateLimit()
    {
        var observer = new ScriptedObserver { Distance=1, MinDistance=.05f, MaxDistance=.5f,
            MaxConfidence=30, InteractionHistorySize=15, NumSmoothingFrames=0,
            ExtremumTypeCheckMethod=ExtremumTypeCheckMethod.Global };
        foreach(var p in observer.PointCloud.AsArray()) p.Z=.7f;
        observer.Candidates = Enumerable.Range(0,21).Select(_ => new Interaction(new Point3(10,10,.7f),InteractionType.None,1)).ToList();
        observer.Candidates.Add(new Interaction(new Point3(75,10,.7f),InteractionType.None,1));
        IList<Interaction> published = null;
        observer.NewInteractions += (_, items) => published = items;
        await observer.Update();
        Assert.That(published, Has.Count.EqualTo(2), "Duplicate pixels must not crowd out another finger.");
    }
}
