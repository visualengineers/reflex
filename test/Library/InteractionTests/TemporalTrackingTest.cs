using System;
using System.Linq;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Filtering.Components;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Util;

namespace InteractionTests;

/// <summary>
/// All times are monotonic seconds. Analytic trajectories are sampled at deliberately irregular
/// intervals; no sleeps or wall-clock dates. Empty updates mean missing observations, while
/// omitted updates model dropped frames. Both must preserve real elapsed time for prediction.
/// </summary>
public class TemporalTrackingTest
{
    private static InteractionSmoothingBehaviour Tracker() => new(20)
    {
        UseVelocityForMapping = true, NumFramesForPrediction = 5,
        PredictionHorizonSeconds = .05, ContactRetentionSeconds = 10,
        MaxConfidence = 20, ConfidenceDecayPerSecond = 10
    };

    private static InteractionFrame Step(InteractionSmoothingBehaviour tracker, double time, params float[] positions) =>
        tracker.Update(positions.Select(x => new Interaction(new Point3(x, 0, -.5f), InteractionType.Push, 5)).ToArray(), time);

    [Test]
    public void DifferentCadencesProduceSameVelocityAndForecastAtSameTime()
    {
        foreach (var times in new[] { new[] { 0d, .02, .05, .1 }, new[] { 0d, .06, .1 } })
        {
            var tracker = Tracker();
            InteractionFrame output = null;
            foreach (var time in times) output = Step(tracker, 1000 + time, (float)(10 + 100*time));
            var motion = tracker.GetVelocities(output).Single();
            Assert.Multiple(() =>
            {
                Assert.That(motion.FirstDerivation.X, Is.EqualTo(100).Within(.001), "Velocity is pixels/second.");
                Assert.That(motion.PredictedPositionBasic.X, Is.EqualTo(25).Within(.001));
                Assert.That(motion.PredictionTimestampSeconds, Is.EqualTo(1000.15).Within(1e-9));
                Assert.That(output.TimestampSeconds, Is.EqualTo(1000.1).Within(1e-9));
            });
        }
    }

    [Test]
    public void QuadraticMotionUsesSecondsSquaredAtIrregularIntervals()
    {
        var tracker = Tracker();
        tracker.UseSecondDerivation = true;
        InteractionFrame output = null;
        foreach (var time in new[] { 0d, .03, .17, .4 })
            output = Step(tracker, time, (float)(10 + 2*time + 5*time*time));
        var motion = tracker.GetVelocities(output).Single();
        Assert.Multiple(() =>
        {
            Assert.That(motion.FirstDerivation.X, Is.EqualTo(6).Within(.001));
            Assert.That(motion.SecondDerivation.X, Is.EqualTo(10).Within(.001));
            Assert.That(motion.PredictedPositionAdvanced.X, Is.EqualTo(11.9125).Within(.001));
        });
    }

    [Test]
    public void DroppedFramesAndExplicitEmptyFramesBothUseElapsedTime()
    {
        foreach (var emptyUpdates in new[] { false, true })
        {
            var tracker = Tracker();
            Step(tracker, 0, 0);
            Step(tracker, .1, 10);
            if (emptyUpdates)
            {
                Step(tracker, .15);
                var lost = tracker.GetVelocities(Step(tracker, .25)).Single();
                Assert.That(lost.MatchingPosition.X, Is.EqualTo(25).Within(.001));
                Assert.That(lost.PredictedPositionBasic.X, Is.EqualTo(30).Within(.001));
                Assert.That(lost.SampleCount, Is.EqualTo(2));
            }
            tracker.TouchMergeDistance2D = 1;
            var output = Step(tracker, .4, 40);
            Assert.That(output.Interactions.Single().TouchId, Is.Zero);
            var motion = tracker.GetVelocities(output).Single();
            Assert.That(motion.MatchingPosition.X, Is.EqualTo(40).Within(.001));
            Assert.That(motion.PredictedPositionBasic.X, Is.EqualTo(45).Within(.001));
        }
    }

    [Test]
    public void CrossingAfterLongerFrameIntervalKeepsBothIds()
    {
        var tracker = Tracker();
        Step(tracker, 0, 20, 100);
        Step(tracker, .1, 40, 80);
        Step(tracker, .15, 50, 70);
        var output = Step(tracker, .25, 50, 70); // positions swap physical identities
        Assert.That(output.Interactions.Single(i => i.TouchId == 0).Position.X, Is.EqualTo(70));
        Assert.That(output.Interactions.Single(i => i.TouchId == 1).Position.X, Is.EqualTo(50));
    }

    [TestCase(double.NaN)]
    [TestCase(double.PositiveInfinity)]
    [TestCase(10d)]
    [TestCase(9d)]
    public void InvalidOrNonIncreasingFrameTimeIsRejectedBeforeChangingState(double invalidTime)
    {
        var tracker = Tracker();
        Step(tracker, 10, 1);
        Assert.Throws<ArgumentOutOfRangeException>(() => Step(tracker, invalidTime, 2));
        Assert.That(tracker.CurrentFrameId, Is.EqualTo(1));
        Assert.That(tracker.InteractionsFramesCache.Single().TimestampSeconds, Is.EqualTo(10));
        Assert.That(Step(tracker, 11, 2).Interactions.Single().TouchId, Is.Zero);
        tracker.Reset();
        Assert.DoesNotThrow(() => Step(tracker, 0, 5));
    }

    [TestCase(10)]
    [TestCase(100)]
    public void ConfidenceGainUsesObservedDurationAndIgnoresTimerPolling(int frequency)
    {
        var tracker = Tracker();
        tracker.MaxConfidence = 100;
        Step(tracker, 0, 10);
        InteractionFrame output = null;
        for (var i = 1; i <= frequency; i++)
        {
            tracker.OutputAt((i - .5) / frequency); // A timer tick is not a missing sensor observation.
            output = Step(tracker, (double)i / frequency, 10);
        }
        Assert.That(output.Interactions.Single().Confidence, Is.EqualTo(35).Within(.0001));
    }

    [Test]
    public void ConfidenceDecayDependsOnMissingDurationNotNumberOfEmptyUpdates()
    {
        foreach (var times in new[] { new[] { .1, .2, .3 }, new[] { .3 } })
        {
            var tracker = Tracker();
            Step(tracker, 0, 10); // confidence 5, decay 10/s
            InteractionFrame output = null;
            foreach (var time in times) output = Step(tracker, time);
            Assert.That(output.Interactions.Single().Confidence, Is.EqualTo(2).Within(.0001));
            Assert.That(tracker.InteractionsFramesCache.Single(f => f.FrameId == 1).Interactions[0].Confidence,
                Is.EqualTo(5), "Raw historical confidence is not mutated by decay.");
            Assert.That(tracker.GetVelocities(output).Single().Confidence, Is.EqualTo(2).Within(.0001));
        }
    }

    [Test]
    public void RecoveryUsesDecayedConfidenceInsteadOfRawOrHistoricalMaximum()
    {
        var tracker = Tracker();
        Step(tracker, 0, 10); // 5
        Step(tracker, .1); // 4
        var recovered = Step(tracker, .3, 10).Interactions.Single(); // 2, recovery does not earn confidence for the lost interval
        Assert.That(recovered.TouchId, Is.Zero);
        Assert.That(recovered.Confidence, Is.EqualTo(2).Within(.0001));
        var lost = Step(tracker, 2).Interactions.Single();
        Assert.That(lost.Confidence, Is.Zero);
        Assert.That(lost.TrackingState, Is.EqualTo(InteractionTrackingState.Lost));
        Assert.That(Step(tracker, 2.1, 10).Interactions.Single().Confidence, Is.Zero);
    }

    [Test]
    public void ContinuousDetectionsDoNotLoseConfidenceBecauseOfALongerInterval()
    {
        var tracker = Tracker();
        Step(tracker, 0, 10);
        Assert.That(Step(tracker, 2, 10).Interactions.Single().Confidence, Is.EqualTo(20));
        Assert.That(Step(tracker, 2.01, 10).Interactions.Single().Confidence, Is.EqualTo(20));
    }

    [TestCase(-.1)]
    [TestCase(1.1)]
    [TestCase(double.NaN)]
    public void InvalidForecastHorizonIsRejected(double horizon)
    {
        var tracker = Tracker();
        Assert.Throws<ArgumentOutOfRangeException>(() => tracker.PredictionHorizonSeconds = horizon);
    }

    [Test]
    public void TemporalPolynomialSmoothingReceivesActualFrameTimes()
    {
        var tracker = Tracker();
        tracker.NumFramesSmoothing = 5;
        tracker.UpdateFilterType(FilterType.PolynomialFit);
        InteractionFrame output = null;
        foreach (var time in new[] { 0d, .02, .07, .13, .4 })
            output = Step(tracker, time, (float)(10 + 2*time + 5*time*time));
        Assert.That(output.Interactions.Single().Position.X, Is.EqualTo(11.6).Within(.0001));
    }

    [TestCase(false)]
    [TestCase(true)]
    public void PolynomialFiltersEvaluateAtRealSampleTimesWithLargeClockOrigin(bool weighted)
    {
        Base2DFilter filter = weighted ? new WeightedPolynomialFitFilter(2) : new PolynomialFitFilter(2);
        var elapsed = new[] { 0d, .01, .05, .16, .4 };
        var points = elapsed.Select(t => new Point3((float)(3 + 2*t + 7*t*t), 0, 1)).ToList();
        var output = filter.Process(points, elapsed.Select(t => 1e6 + t).ToArray());
        Assert.That(output.Select(p => p.X), Is.EqualTo(points.Select(p => p.X)).Within(.0001));
    }

    [Test]
    public void ButterworthHasSameResponseForSameRampAtDifferentCadences()
    {
        var denseTimes = new[] { 0d, .01, .02, .04, .07, .1 };
        var sparseTimes = new[] { 0d, .04, .1 };
        var filter = new ButterworthFilter(cutoffHz: 3);
        var dense = filter.Process(denseTimes.Select(t => new Point3((float)(10*t), 2, -.5f)).ToList(), denseTimes);
        var sparse = filter.Process(sparseTimes.Select(t => new Point3((float)(10*t), 2, -.5f)).ToList(), sparseTimes);
        Assert.That(sparse.Last().X, Is.EqualTo(dense.Last().X).Within(.0001));
        Assert.That(sparse.Last().Z, Is.EqualTo(-.5f).Within(.0001));
        var longGap = filter.Process(new() { new(0,2,1), new(1,2,1), new(1,2,1) }, new[] {0d, .1, 100});
        Assert.That(longGap.Last().X, Is.EqualTo(1).Within(.0001));
    }

    [Test]
    public void TemporalFiltersRejectInvalidTimesEvenDuringWarmupAndDoNotMutateInput()
    {
        var filter = new PolynomialFitFilter();
        var points = new[] {new Point3(1,2,3), new Point3(4,5,6)}.ToList();
        foreach (var times in new[] { new[] {0d}, new[] {0d,0}, new[] {1d,0}, new[] {0d,double.NaN} })
            Assert.Throws<ArgumentException>(() => filter.Process(points, times));
        var result = filter.Process(points, new[] {0d,.1});
        result[0].X = 999;
        Assert.That(points[0].X, Is.EqualTo(1));
    }
}
