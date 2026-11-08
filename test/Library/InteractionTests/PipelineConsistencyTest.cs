using System;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using NUnit.Framework;
using Implementation.Components;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Util;

namespace InteractionTests;

/// <summary>Deterministic regressions from the pipeline audit. Times are monotonic seconds; no sleeps.</summary>
public class PipelineConsistencyTest
{
    private static Interaction Point(float x, float z = -.5f) => new(new Point3(x, 10, z), z < 0 ? InteractionType.Push : InteractionType.Pull, 10);
    private static InteractionSmoothingBehaviour Tracker(int history = 2) => new(history)
    {
        ContactRetentionSeconds = 1, MaxConfidence = 20, TouchMergeDistance2D = 64,
        UseVelocityForMapping = true, NumFramesForPrediction = 2
    };

    [Test]
    public void LostContactShouldRetainSmoothedPositionWhenCacheRollsOver()
    {
        var tracker = Tracker();
        tracker.NumFramesSmoothing = 2;
        tracker.UpdateFilterType(FilterType.MovingAverage);
        tracker.Update(new[] { Point(0) }, 0);
        var measured = tracker.Update(new[] { Point(10) }, .01).Interactions.Single();
        var lost = tracker.Update(Array.Empty<Interaction>(), .02).Interactions.Single();
        Assert.That(lost.Position.X, Is.EqualTo(measured.Position.X));
    }

    [Test]
    public void RecoveryWithinLifetimeShouldKeepMotionAfterEmptyCacheUpdates()
    {
        var tracker = Tracker();
        tracker.Update(new[] { Point(0) }, 0);
        var id = tracker.Update(new[] { Point(10) }, .01).Interactions.Single().TouchId;
        var lost = tracker.Update(Array.Empty<Interaction>(), .02);
        TestContext.Out.WriteLine($"Lost motion after cache eviction: {tracker.GetVelocities(lost).Single().FirstDerivation.X}");
        tracker.TouchMergeDistance2D = 5;
        var recovered = tracker.Update(new[] { Point(30) }, .03).Interactions.Single(x => x.TrackingState != InteractionTrackingState.Lost);
        Assert.That(recovered.TouchId, Is.EqualTo(id));
    }

    [Test]
    public void ClusterFilterShouldPreferMeasuredContactOverLostContact()
    {
        var tracker = Tracker(10);
        tracker.Update(new[] { Point(0) }, 0);
        tracker.TouchMergeDistance2D = 1;
        var frame = tracker.Update(new[] { Point(2) }, .01);
        var manager = (InteractionManager)RuntimeHelpers.GetUninitializedObject(typeof(InteractionManager));
        manager.InputDistance = 10;
        var filter = typeof(InteractionManager).GetMethod("RemoveClusteredInteractions", BindingFlags.NonPublic | BindingFlags.Instance);
        var output = (System.Collections.Generic.IList<Interaction>)filter.Invoke(manager, new object[] { frame.Interactions });
        Assert.That(output.Single().TrackingState, Is.Not.EqualTo(InteractionTrackingState.Lost));
    }

    [Test]
    public void SmoothedDepthShouldRemainConsistentWithPublishedType()
    {
        var tracker = Tracker(10);
        tracker.NumFramesSmoothing = 3;
        tracker.UpdateFilterType(FilterType.MovingAverage);
        tracker.Update(new[] { Point(10, -1) }, 0);
        tracker.Update(new[] { Point(10, -1) }, .01);
        var contact = tracker.Update(new[] { Point(10, .1f) }, .02).Interactions.Single();
        Assert.That(contact.Type, Is.EqualTo(InteractionType.Pull));
        Assert.That(contact.Position.Z, Is.GreaterThan(0));
    }
    [Test]
    public void ButterworthInTrackingPipelineShouldBeCadenceIndependentForSteadyRamp()
    {
        float Run(int hz)
        {
            var tracker = Tracker(10);
            tracker.NumFramesSmoothing = 5;
            tracker.UpdateFilterType(FilterType.Butterworth);
            InteractionFrame output = null;
            for (var i = 0; i <= hz; i++)
                output = tracker.Update(new[] { Point((float)(10d * i / hz)) }, (double)i / hz);
            return output.Interactions.Single().Position.X;
        }
        var slow = Run(25);
        var fast = Run(100);
        TestContext.Out.WriteLine($"Butterworth at t=1: 25Hz={slow}, 100Hz={fast}");
        Assert.That(fast, Is.EqualTo(slow).Within(.01));
    }

}
