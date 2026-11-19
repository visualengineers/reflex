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
    public void DefaultRetentionIsIndependentOfHistorySize()
    {
        var observer = new Observer();
        Assert.That(observer.ContactRetentionSeconds, Is.EqualTo(.1));
        observer.ContactRetentionSeconds = .25;
        observer.InteractionHistorySize = 1;
        Assert.That(observer.ContactRetentionSeconds, Is.EqualTo(.25));
        var tracker = new InteractionSmoothingBehaviour(25) { ContactRetentionSeconds = .25 };
        tracker.NumFramesHistory = 1;
        Assert.That(tracker.ContactRetentionSeconds, Is.EqualTo(.25));
    }

    [TestCase(-1)]
    [TestCase(double.NaN)]
    [TestCase(double.PositiveInfinity)]
    public void InvalidRetentionIsRejected(double duration)
    {
        var observer = new Observer();
        var tracker = new InteractionSmoothingBehaviour(25);
        Assert.Throws<ArgumentOutOfRangeException>(() => observer.ContactRetentionSeconds = duration);
        Assert.Throws<ArgumentOutOfRangeException>(() => tracker.ContactRetentionSeconds = duration);
        Assert.That(observer.ContactRetentionSeconds, Is.EqualTo(.1));
    }

    [TestCase(-1, 0)]
    [TestCase(0, 0)]
    [TestCase(1, 1)]
    [TestCase(100, 25)]
    public void SmoothingRemainsBoundedByHistory(int requested, int expected)
    {
        var observer = new Observer { NumSmoothingFrames = requested };
        Assert.That(observer.NumSmoothingFrames, Is.EqualTo(expected));
    }

    [TestCase(-5, 0, 0)]
    [TestCase(0, 0, 0)]
    [TestCase(1, 1, 1)]
    [TestCase(3, 3, 3)]
    public void ReducingHistoryStillClampsSmoothing(int requested, int history, int smoothing)
    {
        var observer = new Observer { InteractionHistorySize = requested };
        Assert.That(observer.InteractionHistorySize, Is.EqualTo(history));
        Assert.That(observer.NumSmoothingFrames, Is.EqualTo(smoothing));
        Assert.That(observer.ContactRetentionSeconds, Is.EqualTo(.1));
    }

    [TestCase(-1f)]
    [TestCase(float.NaN)]
    [TestCase(float.PositiveInfinity)]
    public void InvalidConfidenceRatesAreRejected(float value)
    {
        var observer = new Observer();
        Assert.Throws<ArgumentOutOfRangeException>(() => observer.ConfidenceGainPerSecond = value);
        Assert.Throws<ArgumentOutOfRangeException>(() => observer.ConfidenceDecayPerSecond = value);
        Assert.That(observer.ConfidenceGainPerSecond, Is.EqualTo(30));
        Assert.That(observer.ConfidenceDecayPerSecond, Is.EqualTo(30));
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
