using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Filtering.Components;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Util;

namespace InteractionTests;

/// <summary>
/// Analytic trajectories in raster units per processed frame. No clock, sleeps or random data:
/// constant motion p(t)=10+2t, accelerated motion p(t)=10+t² and crossings have exact solutions.
/// Missing frames advance time but must never become observations in the derivative fit.
/// </summary>
public class PositionPredictionTest
{
    private static InteractionSmoothingBehaviour Tracker(bool acceleration = false, int samples = 3) => new(12)
    {
        UseVelocityForMapping = true, UseSecondDerivation = acceleration,
        NumFramesForPrediction = samples, MaxNumEmptyFramesBetween = 3,
        TouchMergeDistance2D = 64, MaxConfidence = 20
    };

    private static InteractionFrame Step(InteractionSmoothingBehaviour tracker, params float[] x) =>
        tracker.Update(x.Select(value => new Interaction(new Point3(value, 10, -.5f), InteractionType.Push, 1)).ToList());

    [TestCase(2f)]
    [TestCase(-2f)]
    [TestCase(0f)]
    public void ConstantVelocityPredictsForwardInEitherDirection(float speed)
    {
        var tracker = Tracker();
        Step(tracker, 10);
        Step(tracker, 10 + speed);
        var output = Step(tracker, 10 + 2*speed);
        var velocity = tracker.GetVelocities(output).Single();
        Assert.Multiple(() =>
        {
            Assert.That(velocity.FirstDerivation.X, Is.EqualTo(speed).Within(.0001));
            Assert.That(velocity.PredictedPositionBasic.X, Is.EqualTo(10 + 3*speed).Within(.0001));
            Assert.That(velocity.PredictedPositionAdvanced.X, Is.EqualTo(velocity.PredictedPositionBasic.X).Within(.0001));
            Assert.That(velocity.FrameId, Is.EqualTo(3));
            Assert.That(velocity.PredictionFrameId, Is.EqualTo(4));
        });
    }

    [Test]
    public void ConstantAccelerationUsesVelocityAtLatestMeasurementAndHalfAcceleration()
    {
        var tracker = Tracker(acceleration: true);
        Step(tracker, 10); // t=0
        Step(tracker, 11); // t=1
        var output = Step(tracker, 14); // t=2: v=4, a=2
        var velocity = tracker.GetVelocities(output).Single();
        Assert.Multiple(() =>
        {
            Assert.That(velocity.FirstDerivation.X, Is.EqualTo(4).Within(.0001));
            Assert.That(velocity.SecondDerivation.X, Is.EqualTo(2).Within(.0001));
            Assert.That(velocity.PredictedPositionBasic.X, Is.EqualTo(18).Within(.0001));
            Assert.That(velocity.PredictedPositionAdvanced.X, Is.EqualTo(19).Within(.0001));
        });
    }

    [Test]
    public void TwoSamplesUseLinearFallbackEvenWhenAccelerationIsEnabled()
    {
        var tracker = Tracker(acceleration: true);
        Step(tracker, 10);
        var velocity = tracker.GetVelocities(Step(tracker, 12)).Single();
        Assert.That(velocity.SecondDerivation.X, Is.Zero);
        Assert.That(velocity.PredictedPositionAdvanced.X, Is.EqualTo(14).Within(.0001));
    }

    [Test]
    public void WarmupProcessesEveryContactAndRetainsIndependentMotion()
    {
        var tracker = Tracker();
        var first = tracker.GetVelocities(Step(tracker, 10, 100));
        Assert.That(first, Has.Count.EqualTo(2));
        Assert.That(first.All(v => v.SampleCount == 1 && v.FirstDerivation.X == 0), Is.True);
        var next = tracker.GetVelocities(Step(tracker, 12, 97));
        Assert.That(next.Select(v => v.PredictedPositionBasic.X), Is.EqualTo(new[] {14f, 94f}).Within(.0001));
    }

    [Test]
    public void GapsPreserveElapsedFrameTimeAndDoNotGenerateSyntheticSamples()
    {
        var tracker = Tracker();
        Step(tracker, 10);
        Step(tracker, 12);
        var lost = tracker.GetVelocities(Step(tracker)).Single();
        Assert.Multiple(() =>
        {
            Assert.That(lost.IsPredicted, Is.True);
            Assert.That(lost.SampleCount, Is.EqualTo(2));
            Assert.That(lost.MatchingPosition.X, Is.EqualTo(14).Within(.0001));
            Assert.That(lost.PredictedPositionBasic.X, Is.EqualTo(16).Within(.0001));
        });
        var returned = tracker.GetVelocities(Step(tracker, 16)).Single();
        Assert.That(returned.FirstDerivation.X, Is.EqualTo(2).Within(.0001));
        Assert.That(returned.MatchingPosition.X, Is.EqualTo(16).Within(.0001));
    }

    [Test]
    public void AccelerationFitHandlesUnequalObservationIntervals()
    {
        var tracker = Tracker(acceleration: true);
        Step(tracker, 10);
        Step(tracker, 11);
        Step(tracker); // t=2 missing
        var velocity = tracker.GetVelocities(Step(tracker, 19)).Single(); // t=3
        Assert.That(velocity.PredictedPositionAdvanced.X, Is.EqualTo(26).Within(.0001));
    }

    [Test]
    public void CrossingTracksKeepIdentityUsingForecastRatherThanNearestOldPosition()
    {
        var tracker = Tracker();
        var born = Step(tracker, 0, 20);
        Step(tracker, 4, 16);
        Step(tracker, 8, 12);
        var crossed = Step(tracker, 8, 12); // input order reversed: A is now 12, B is now 8
        Assert.Multiple(() =>
        {
            Assert.That(crossed.Interactions.Single(i => i.Position.X == 12).TouchId, Is.EqualTo(born.Interactions[0].TouchId));
            Assert.That(crossed.Interactions.Single(i => i.Position.X == 8).TouchId, Is.EqualTo(born.Interactions[1].TouchId));
            Assert.That(crossed.Interactions.Select(i => i.TouchId).Distinct().Count(), Is.EqualTo(2));
        });
    }

    [Test]
    public void PredictionWinsEvenWhenOldPositionFallsOutsideGate()
    {
        var tracker = Tracker();
        Step(tracker, 0);
        Step(tracker, 10);
        tracker.TouchMergeDistance2D = 2;
        Assert.That(Step(tracker, 20).Interactions.Single().TouchId, Is.Zero);
    }

    [Test]
    public void ExpiryAndResetDiscardMotionOfPreviousContacts()
    {
        var tracker = Tracker();
        tracker.MaxNumEmptyFramesBetween = 0;
        Step(tracker, 0);
        Step(tracker, 10);
        Assert.That(tracker.GetVelocities(Step(tracker)), Is.Empty);
        var newContact = tracker.GetVelocities(Step(tracker, 20)).Single();
        Assert.That(newContact.SampleCount, Is.EqualTo(1));
        Assert.That(newContact.FirstDerivation.X, Is.Zero);
        tracker.Reset();
        Assert.That(tracker.GetVelocities(Step(tracker, 50)).Single().FirstDerivation.X, Is.Zero);
    }

    [Test]
    public void DisablingPredictionRestoresLastPositionMappingAndClearsDiagnostics()
    {
        var tracker = Tracker();
        Step(tracker, 0);
        Step(tracker, 10);
        tracker.UseVelocityForMapping = false;
        tracker.TouchMergeDistance2D = 2;
        var next = Step(tracker, 20);
        Assert.That(next.Interactions.Single(i => i.TrackingState == InteractionTrackingState.Tentative).TouchId, Is.EqualTo(1));
        Assert.That(tracker.GetVelocities(next), Is.Empty);
    }

    [Test]
    public void SmoothingUsesNewestWindowAndEndpointWithoutChangingPrediction()
    {
        var tracker = Tracker();
        tracker.NumFramesSmoothing = 2;
        tracker.UpdateFilterType(FilterType.MovingAverage);
        Step(tracker, 0);
        Step(tracker, 2);
        Step(tracker, 4);
        var output = Step(tracker, 6);
        Assert.That(output.Interactions.Single().Position.X, Is.EqualTo(5).Within(.0001));
        var velocity = tracker.GetVelocities(output).Single();
        Assert.That(velocity.MeasuredPosition.X, Is.EqualTo(6));
        Assert.That(velocity.PredictedPositionBasic.X, Is.EqualTo(8).Within(.0001));
        Assert.That(tracker.InteractionsFramesCache.OrderBy(f => f.FrameId).Select(f => f.Interactions[0].Position.X),
            Is.EqualTo(new[] {0f, 2f, 4f, 6f}));
    }

    [TestCase(FilterType.MovingAverage)]
    [TestCase(FilterType.WeightedMovingAverage)]
    [TestCase(FilterType.PolynomialFit)]
    [TestCase(FilterType.WeightedPolynomialFit)]
    [TestCase(FilterType.Butterworth)]
    [TestCase(FilterType.SavitzkyGolay)]
    public void EveryFilterProducesFiniteCurrentOutputAndPreservesConstantDepth(FilterType filter)
    {
        var tracker = Tracker();
        tracker.NumFramesSmoothing = 6;
        tracker.UpdateFilterType(filter);
        InteractionFrame output = null;
        for (var i = 0; i < 15; i++) output = Step(tracker, i);
        var position = output.Interactions.Single().Position;
        Assert.That(float.IsFinite(position.X), Is.True);
        Assert.That(position.X, Is.GreaterThan(8), "Must represent the latest window, not the oldest cached sample.");
        Assert.That(position.Z, Is.EqualTo(-.5f).Within(.0001));
    }

    [Test]
    public void VelocityUpdateRefreshesDerivativesAndOwnsItsPoints()
    {
        var position = new Point3(10, 20, -.5f);
        var speed = new Point3(4, 0, 0);
        var acceleration = new Point3(2, 0, 0);
        var velocity = new InteractionVelocity();
        velocity.Update(position, speed, acceleration, .5f, 2);
        position.X = 100;
        speed.X = 100;
        acceleration.X = 100;
        Assert.Multiple(() =>
        {
            Assert.That(velocity.MeasuredPosition.X, Is.EqualTo(10));
            Assert.That(velocity.FirstDerivation.X, Is.EqualTo(4));
            Assert.That(velocity.SecondDerivation.X, Is.EqualTo(2));
            Assert.That(velocity.PredictedPositionBasic.X, Is.EqualTo(18));
            Assert.That(velocity.PredictedPositionAdvanced.X, Is.EqualTo(22));
        });
    }

    [Test]
    public void MovingAverageOutputsOneSamplePerInputAndUsesRawWindow()
    {
        var points = new List<Point3> { new(0,0,0), new(2,0,0), new(4,0,0), new(6,0,0) };
        Assert.That(new SimpleMovingAverageFilter(2).Process(points).Select(p => p.X), Is.EqualTo(new[] {0f,1f,3f,5f}));
        Assert.That(new WeightedMovingAverageFilter(2).Process(points).Select(p => p.X),
            Is.EqualTo(new[] {0f,4f/3,10f/3,16f/3}).Within(.0001));
    }
}
