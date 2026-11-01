using System;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Util;

namespace InteractionTests;

/// <summary>Boundary tests exercise the public observer configuration and its actual tracking output.</summary>
public class TrackingConfigurationTest
{
    private sealed class Observer : MultiInteractionObserver
    {
        public InteractionFrame Step(params Interaction[] measurements) => ComputeSmoothingValue(measurements);
    }

    private static Interaction Contact() => new(new Point3(10, 10, -.5f), InteractionType.Push, 0);

    [Test]
    public void DefaultsReachTrackerAndEmptyFramesAreBounded()
    {
        var observer = new Observer();
        Assert.Multiple(() =>
        {
            Assert.That(observer.InteractionHistorySize, Is.EqualTo(25));
            Assert.That(observer.NumSmoothingFrames, Is.EqualTo(5));
            Assert.That(observer.MaxNumEmptyFramesBetween, Is.EqualTo(3));
            Assert.That(observer.DepthScale, Is.EqualTo(100));
        });
        observer.Step(Contact());
        for (var i = 0; i < 3; i++) Assert.That(observer.Step().Interactions, Has.Count.EqualTo(1));
        Assert.That(observer.Step().Interactions, Is.Empty);
    }

    [TestCase(-1, 0, 0)]
    [TestCase(0, 0, 0)]
    [TestCase(1, 1, 1)]
    [TestCase(5, 5, 5)]
    [TestCase(25, 25, 24)]
    [TestCase(100, 25, 24)]
    public void ValuesAreClampedToDocumentedRanges(int requested, int smoothing, int gap)
    {
        var observer = new Observer { NumSmoothingFrames = requested, MaxNumEmptyFramesBetween = requested };
        var tracker = new InteractionSmoothingBehaviour(25)
        {
            NumFramesSmoothing = requested, MaxNumEmptyFramesBetween = requested
        };
        Assert.Multiple(() =>
        {
            Assert.That(observer.NumSmoothingFrames, Is.EqualTo(smoothing));
            Assert.That(observer.MaxNumEmptyFramesBetween, Is.EqualTo(gap));
            Assert.That(tracker.NumFramesSmoothing, Is.EqualTo(smoothing));
            Assert.That(tracker.MaxNumEmptyFramesBetween, Is.EqualTo(gap));
        });
    }

    [TestCase(-5, 0, 0, 0)]
    [TestCase(0, 0, 0, 0)]
    [TestCase(1, 1, 1, 0)]
    [TestCase(3, 3, 3, 2)]
    public void ReducingHistoryReclampsDependentParameters(int requested, int history, int smoothing, int gap)
    {
        var observer = new Observer { InteractionHistorySize = requested };
        Assert.Multiple(() =>
        {
            Assert.That(observer.InteractionHistorySize, Is.EqualTo(history));
            Assert.That(observer.NumSmoothingFrames, Is.EqualTo(smoothing));
            Assert.That(observer.MaxNumEmptyFramesBetween, Is.EqualTo(gap));
        });
    }

    [Test]
    public void ConfiguredGapIsNotRaisedToHistorySize()
    {
        var observer = new Observer { InteractionHistorySize = 25, MaxNumEmptyFramesBetween = 1 };
        observer.Step(Contact());
        Assert.That(observer.Step().Interactions, Has.Count.EqualTo(1));
        Assert.That(observer.Step().Interactions, Is.Empty);
    }

    [TestCase(FilterType.MovingAverage)]
    [TestCase(FilterType.WeightedMovingAverage)]
    [TestCase(FilterType.SavitzkyGolay)]
    public void SmallAndResizedHistoriesHaveValidFilterWindows(FilterType filter)
    {
        var tracker = new InteractionSmoothingBehaviour(25);
        tracker.UpdateFilterType(filter);
        tracker.NumFramesHistory = 1;
        tracker.NumFramesSmoothing = 1;
        Assert.That(tracker.Update(new[] { Contact() }).Interactions[0].Position.Z, Is.EqualTo(-.5f).Within(.00001));
        tracker.NumFramesHistory = 0;
        Assert.That(tracker.Update(new[] { Contact() }).Interactions, Has.Count.EqualTo(1));
    }

    [TestCase(0f)]
    [TestCase(-1f)]
    [TestCase(float.NaN)]
    [TestCase(float.PositiveInfinity)]
    public void InvalidDepthScaleIsRejected(float value)
    {
        var tracker = new InteractionSmoothingBehaviour(10);
        Assert.Throws<ArgumentOutOfRangeException>(() => tracker.DepthScale = value);
    }
}
