using System;
using System.Linq;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Util;
using Math = System.Math;

namespace InteractionTests;

public class KalmanContactTest
{
    private static Interaction Point(float x, float y = 10, InteractionType type = InteractionType.Push)
        => new(new Point3(x, y, type == InteractionType.Push ? -.5f : .5f), type, 10);
    private static InteractionSmoothingBehaviour Tracker() => new(15)
    {
        UseKalmanFilter = true, UseVelocityForMapping = true,
        TouchMergeDistance2D = 81, ContactRetentionSeconds = 1, MaxConfidence = 30
    };

    [Test]
    public void OneCorrectionMatchesAnIndependentScalarKalmanCalculation()
    {
        var filter = new KalmanContactMotion(new Point3(0, 0, -.5f), 10);
        filter.Update(new Point3(8, -4, -.5f), 11);
        // P0=diag(4,10000), F=[[1,1],[0,1]], Q=400000*[[1/3,1/2],[1/2,1]].
        var predictedVariance = 4 + 10000 + 400000.0 / 3;
        var innovationVariance = predictedVariance + 4;
        var expectedPosition = 8 * predictedVariance / innovationVariance;
        var expectedVelocity = 8 * (10000 + 200000) / innovationVariance;
        var estimate = filter.Predict(11, -.5f);
        Assert.Multiple(() =>
        {
            Assert.That(estimate.Position.X, Is.EqualTo(expectedPosition).Within(1e-5));
            Assert.That(estimate.Position.Y, Is.EqualTo(-expectedPosition / 2).Within(1e-5));
            Assert.That(filter.Velocity.X, Is.EqualTo(expectedVelocity).Within(1e-5));
            Assert.That(estimate.VarianceX, Is.EqualTo(4 * predictedVariance / innovationVariance).Within(1e-8));
        });
    }

    [Test]
    public void ForecastsDoNotMutateStateAndUncertaintyGrowsThroughGaps()
    {
        var filter = new KalmanContactMotion(new Point3(0, 0, 0), 0);
        filter.Update(new Point3(1, 2, 0), .1);
        var before = filter.Predict(.1, 0);
        var future = filter.Predict(.4, 0);
        filter.Predict(.2, 0);
        var after = filter.Predict(.1, 0);
        Assert.Multiple(() =>
        {
            Assert.That(after.Position.X, Is.EqualTo(before.Position.X));
            Assert.That(after.VarianceX, Is.EqualTo(before.VarianceX));
            Assert.That(future.VarianceX, Is.GreaterThan(before.VarianceX));
            Assert.That(filter.MeasurementCount, Is.EqualTo(2));
            Assert.That(filter.LastMeasurementTime, Is.EqualTo(.1));
        });
    }

    [Test]
    public void IrregularlySampledConstantMotionConvergesAndPredictsAtActualTime()
    {
        var tracker = Tracker();
        InteractionFrame frame = null;
        foreach (var time in new[] { 0d, .03, .09, .11, .2, .33, .5, .7, 1.0 })
            frame = tracker.Update(new[] { Point((float)(10 + 20 * time), (float)(30 - 10 * time)) }, time);
        var diagnostic = tracker.GetVelocities(frame).Single();
        Assert.Multiple(() =>
        {
            Assert.That(diagnostic.UseKalmanFilter, Is.True);
            Assert.That(diagnostic.FirstDerivation.X, Is.EqualTo(20).Within(.1));
            Assert.That(diagnostic.FirstDerivation.Y, Is.EqualTo(-10).Within(.1));
            Assert.That(diagnostic.MeasuredPosition.X, Is.EqualTo(30));
            Assert.That(diagnostic.PredictedPositionBasic.X, Is.EqualTo(31).Within(.1));
            Assert.That(diagnostic.UseSecondDerivation, Is.False);
            Assert.That(frame.Interactions.Single().TouchId, Is.Zero);
        });
    }

    [Test]
    public void RepeatedNoisyMeasurementsHaveLowerPositionErrorThanRawInput()
    {
        var tracker = Tracker();
        double rawError = 0, filteredError = 0;
        for (var i = 0; i < 240; i++)
        {
            var truth = 100 + i / 30f * 15;
            var noise = i % 2 == 0 ? 2f : -2f;
            var result = tracker.Update(new[] { Point(truth + noise) }, i / 30.0);
            if (i < 30) continue;
            rawError += noise * noise;
            filteredError += Math.Pow(result.Interactions.Single().Position.X - truth, 2);
        }
        TestContext.Out.WriteLine($"Controlled alternating-noise squared-error ratio: {filteredError / rawError:F6}");
        Assert.That(filteredError, Is.LessThan(rawError * .5));
    }

    [TestCase(30, false, false)]
    [TestCase(30, false, true)]
    [TestCase(30, true, false)]
    [TestCase(30, true, true)]
    [TestCase(60, false, false)]
    [TestCase(60, false, true)]
    [TestCase(60, true, false)]
    [TestCase(60, true, true)]
    public void FastReversalsAndCurvesKeepOneIdentityWithMeasurementNoise(int rate, bool circular, bool minimumCost)
    {
        var tracker = Tracker();
        tracker.UseMinimumCostAssignment = minimumCost;
        // Independent synthetic trajectories, not samples from the tuning recordings.
        // 900 px/s with abrupt reversals, or a 110 px radius at 10 rad/s; ±1 px XY noise.
        for (var frame = 0; frame < rate * 6; frame++)
        {
            var time = frame / (double)rate;
            var phase = time % .8;
            var noise = frame % 2 == 0 ? 1 : -1;
            var x = circular ? 300 + 110 * Math.Cos(10 * time) : 100 + 900 * Math.Min(phase, .8 - phase);
            var y = circular ? 220 + 110 * Math.Sin(10 * time) : 200;
            var result = tracker.Update(new[] { Point((float)x + noise, (float)y + noise) }, time);
            Assert.That(result.Interactions, Has.Count.EqualTo(1), $"Lost/new track at frame {frame}");
            Assert.That(result.Interactions.Single().TouchId, Is.Zero, $"Identity changed at frame {frame}");
        }
        Assert.That(tracker.CurrentMaxId, Is.EqualTo(1));
    }

    [Test]
    public void KalmanReplacesXYSmoothingButPreservesTheSelectedDepthFilter()
    {
        var tracker = Tracker();
        tracker.NumFramesSmoothing = 3;
        tracker.UpdateFilterType(FilterType.MovingAverage);
        tracker.Update(new[] { new Interaction(new Point3(0, 10, -.1f), InteractionType.Push, 10) }, 0);
        tracker.Update(new[] { new Interaction(new Point3(10, 10, -.3f), InteractionType.Push, 10) }, .1);
        var frame = tracker.Update(new[] { new Interaction(new Point3(20, 10, -.7f), InteractionType.Push, 10) }, .2);
        Assert.Multiple(() =>
        {
            Assert.That(frame.Interactions.Single().Position.Z, Is.EqualTo(-1.1 / 3).Within(1e-6));
            Assert.That(frame.Interactions.Single().Position.X, Is.GreaterThan(18),
                "XY comes from the posterior instead of the moving average (10).");
            Assert.That(tracker.GetVelocities(frame).Single().MeasuredPosition.Z, Is.EqualTo(-.7f));
        });
    }

    [Test]
    public void KalmanDiagnosticsRemainAvailableWithoutPredictionAndReportGrowingPositionCovariance()
    {
        var tracker = Tracker();
        tracker.UseVelocityForMapping = false;
        tracker.Update(new[] { Point(0) }, 0);
        var observed = tracker.Update(new[] { Point(2) }, .1);
        var current = tracker.GetVelocities(observed).Single();
        var coast = tracker.GetVelocities(tracker.OutputAt(.3)).Single();
        Assert.Multiple(() =>
        {
            Assert.That(current.UseVelocityPrediction, Is.False);
            Assert.That(current.UseKalmanFilter, Is.True);
            Assert.That(current.KalmanPosition.X, Is.EqualTo(observed.Interactions.Single().Position.X));
            Assert.That(current.KalmanVarianceX, Is.GreaterThan(0));
            Assert.That(coast.KalmanVarianceX, Is.GreaterThan(current.KalmanVarianceX));
            Assert.That(coast.KalmanPosition.X, Is.GreaterThan(current.KalmanPosition.X));
            Assert.That(coast.SampleCount, Is.EqualTo(current.SampleCount));
        });
        tracker.UseKalmanFilter = false;
        Assert.That(tracker.GetVelocities(tracker.OutputAt(.3)), Is.Empty);
    }

    [Test]
    public void EmptyObservationsAndTimerPublicationHoldPositionWithoutConfirmingFilter()
    {
        var tracker = Tracker();
        tracker.Update(new[] { Point(0) }, 0);
        var observed = tracker.Update(new[] { Point(2) }, .1);
        var lost = tracker.Update(Array.Empty<Interaction>(), .2);
        var timer = tracker.OutputAt(.3);
        Assert.Multiple(() =>
        {
            Assert.That(lost.Interactions.Single().Position.X, Is.EqualTo(observed.Interactions.Single().Position.X));
            Assert.That(timer.Interactions.Single().Position.X, Is.EqualTo(observed.Interactions.Single().Position.X));
            Assert.That(tracker.GetVelocities(timer).Single().SampleCount, Is.EqualTo(2));
            Assert.That(tracker.GetVelocities(timer).Single().PredictionTimestampSeconds, Is.EqualTo(.35).Within(1e-10));
        });
        var recovered = tracker.Update(new[] { Point(8) }, .4);
        Assert.That(recovered.Interactions.Single().TouchId, Is.EqualTo(observed.Interactions.Single().TouchId));
        Assert.That(tracker.GetVelocities(recovered).Single().SampleCount, Is.EqualTo(3));
    }

    [Test]
    public void ToggleBootstrapsOnlyRealHistoryAndPreservesIdentityAndRawSnapshots()
    {
        var tracker = Tracker();
        tracker.UseKalmanFilter = false;
        tracker.Update(new[] { Point(0) }, 0);
        tracker.Update(new[] { Point(2) }, .1);
        var input = Point(4);
        var original = tracker.Update(new[] { input }, .2);
        var confidence = original.Interactions.Single().Confidence;
        tracker.UseKalmanFilter = true;
        tracker.UseKalmanFilter = true; // Reapplying settings must not reset/retrain the state.
        var frame = tracker.Update(new[] { Point(6) }, .3);
        Assert.That(tracker.GetVelocities(frame).Single().SampleCount, Is.EqualTo(4));
        tracker.UseKalmanFilter = false;
        var disabled = tracker.Update(new[] { Point(8) }, .4);
        Assert.Multiple(() =>
        {
            Assert.That(frame.Interactions.Single().TouchId, Is.EqualTo(original.Interactions.Single().TouchId));
            Assert.That(disabled.Interactions.Single().TouchId, Is.EqualTo(original.Interactions.Single().TouchId));
            Assert.That(disabled.Interactions.Single().Position.X, Is.EqualTo(8));
            Assert.That(frame.Interactions.Single().Confidence, Is.GreaterThanOrEqualTo(confidence));
            Assert.That(original.Interactions.Single().Position.X, Is.EqualTo(4));
            Assert.That(input.TouchId, Is.EqualTo(-1));
            Assert.That(input.Position.X, Is.EqualTo(4));
        });
    }

    [TestCase(false)]
    [TestCase(true)]
    public void OppositePressureTypesNeverShareAnIdInEitherAssignmentStrategy(bool minimumCost)
    {
        var tracker = Tracker();
        tracker.UseMinimumCostAssignment = minimumCost;
        var first = tracker.Update(new[] { Point(10), Point(20, type: InteractionType.Pull) }, 0);
        var second = tracker.Update(new[] { Point(20), Point(10, type: InteractionType.Pull) }, .1);
        Assert.Multiple(() =>
        {
            Assert.That(second.Interactions.Single(i => i.Type == InteractionType.Push).TouchId,
                Is.EqualTo(first.Interactions.Single(i => i.Type == InteractionType.Push).TouchId));
            Assert.That(second.Interactions.Single(i => i.Type == InteractionType.Pull).TouchId,
                Is.EqualTo(first.Interactions.Single(i => i.Type == InteractionType.Pull).TouchId));
        });
    }

    [TestCase(false, false)]
    [TestCase(false, true)]
    [TestCase(true, false)]
    [TestCase(true, true)]
    public void PressureTypeChangeStartsANewTrackEvenWithKalmanDisabled(bool kalman, bool minimumCost)
    {
        var tracker = Tracker();
        tracker.UseKalmanFilter = kalman;
        tracker.UseMinimumCostAssignment = minimumCost;
        var id = tracker.Update(new[] { Point(10) }, 0).Interactions.Single().TouchId;
        var frame = tracker.Update(new[] { Point(10, type: InteractionType.Pull) }, .1);
        var current = frame.Interactions.Single(i => i.TrackingState != InteractionTrackingState.Lost);
        Assert.Multiple(() =>
        {
            Assert.That(current.TouchId, Is.Not.EqualTo(id));
            Assert.That(current.TrackingState, Is.EqualTo(InteractionTrackingState.Tentative));
            Assert.That(frame.Interactions.Single(i => i.TouchId == id).TrackingState, Is.EqualTo(InteractionTrackingState.Lost));
            Assert.That(current.Position.Z, Is.Positive);
        });
    }

    [TestCase(false)]
    [TestCase(true)]
    public void VelocitySwitchControlsExtrapolationOfTheKalmanMatchingTarget(bool predict)
    {
        var tracker = Tracker();
        tracker.Update(new[] { Point(0) }, 0);
        tracker.Update(new[] { Point(2) }, .1);
        var previous = tracker.Update(new[] { Point(4) }, .2).Interactions.Single();
        tracker.UseVelocityForMapping = predict;
        tracker.TouchMergeDistance2D = 1;
        var frame = tracker.Update(new[] { Point(6) }, .3);
        var measured = frame.Interactions.Single(i => i.TrackingState != InteractionTrackingState.Lost);
        Assert.That(measured.TouchId == previous.TouchId, Is.EqualTo(predict));
    }

    [Test]
    public void DisabledHistoryDoesNotRetainAKalmanTrack()
    {
        var tracker = Tracker();
        tracker.NumFramesHistory = 0;
        var first = tracker.Update(new[] { Point(0) }, 0).Interactions.Single();
        var second = tracker.Update(new[] { Point(2) }, .1).Interactions.Single();
        Assert.That(second.TouchId, Is.Not.EqualTo(first.TouchId));
        Assert.That(second.Position.X, Is.EqualTo(2));
        Assert.That(tracker.Update(Array.Empty<Interaction>(), .2).Interactions, Is.Empty);
    }

    [Test]
    public void KalmanRejectsNonFiniteInputAndDoesNotUpdateFromInvalidTime()
    {
        var filter = new KalmanContactMotion(new Point3(1, 2, 0), 1);
        Assert.Throws<ArgumentOutOfRangeException>(() => filter.Update(new Point3(float.NaN, 2, 0), 2));
        Assert.Throws<ArgumentOutOfRangeException>(() => filter.Update(new Point3(1, 2, 0), 1));
        Assert.Throws<ArgumentOutOfRangeException>(() => filter.Predict(double.NaN, 0));
        Assert.That(filter.MeasurementCount, Is.EqualTo(1));
        var tracker = Tracker();
        var frame = tracker.Update(new[] { Point(float.NaN), Point(10) }, 0);
        Assert.That(frame.Interactions, Has.Count.EqualTo(1));
        Assert.That(frame.Interactions.Single().Position.X, Is.EqualTo(10));
    }

    [Test]
    public void ExpiryAndResetRemoveTheKalmanStatePermanently()
    {
        var tracker = Tracker();
        var first = tracker.Update(new[] { Point(10) }, 0).Interactions.Single();
        tracker.Update(new[] { Point(11) }, .1);
        Assert.That(tracker.OutputAt(2).Interactions, Is.Empty);
        var next = tracker.Update(new[] { Point(10) }, 2.1);
        Assert.That(next.Interactions.Single().TouchId, Is.Not.EqualTo(first.TouchId));
        Assert.That(tracker.GetVelocities(next).Single().SampleCount, Is.EqualTo(1));
        tracker.Reset();
        var reset = tracker.Update(new[] { Point(30) }, 3);
        Assert.That(reset.Interactions.Single().Position.X, Is.EqualTo(30));
        Assert.That(tracker.GetVelocities(reset).Single().FirstDerivation.X, Is.Zero);
    }
}
