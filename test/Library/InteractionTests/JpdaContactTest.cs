using System;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Util;
using Math = System.Math;

namespace InteractionTests;

public class JpdaContactTest
{
    private static Interaction Point(float x, InteractionType type = InteractionType.Push)
        => new(new Point3(x, 20, type == InteractionType.Push ? -.5f : .5f), type, 20);
    private static InteractionSmoothingBehaviour Tracker(bool enabled = true, bool kalman = false, bool global = true)
        => new(2) { UseJpda = enabled, UseKalmanFilter = kalman, UseMinimumCostAssignment = global,
            TouchMergeDistance2D = 40, ContactRetentionSeconds = .1, ObservationTimeoutSeconds = 1,
            MaxConfidence = 30 };

    [Test]
    public void OneMeasurementHasExclusiveJointProbabilitiesForTwoEquallyLikelyTracks()
    {
        var result = JpdaContactAssignment.Assign(new[] { Point(5) },
            new[] { (7, Point(0).Position, InteractionType.Push), (9, Point(10).Position, InteractionType.Push) }, 20, .5f, .5f);
        // Three feasible events: both tracks miss + birth, match 7, or match 9.
        // Full costs are 1.5, .75, .75; normalize relative to the two matching events.
        var expected = 1 / (2 + Math.Exp(-(.75) / .15));
        Assert.Multiple(() =>
        {
            Assert.That(result.Associations[0, 0], Is.EqualTo(expected).Within(1e-12));
            Assert.That(result.Associations[0, 1], Is.EqualTo(expected).Within(1e-12));
            Assert.That(result.Misses[0], Is.EqualTo(1 - expected).Within(1e-12));
            Assert.That(result.Births[0], Is.EqualTo(1 - 2 * expected).Within(1e-12));
            Assert.That(result.AssignedIds[0], Is.EqualTo(7));
            Assert.That(result.IsMasked(9), Is.True);
            Assert.That(result.Approximate, Is.False);
        });
    }

    [Test]
    public void MarginalsMatchIndependentExhaustiveJointEnumeration()
    {
        var random = new Random(3512);
        for (var example = 0; example < 50; example++)
        {
            var candidates = Enumerable.Range(0, 3).Select(_ => Point(random.Next(80))).ToArray();
            var tracks = Enumerable.Range(0, 3).Select(id => (TouchId: id, Position: Point(random.Next(80)).Position,
                Type: InteractionType.Push)).ToArray();
            var actual = JpdaContactAssignment.Assign(candidates, tracks, 40, .5f, .5f);
            var events = new List<(int[] Assignment, double Weight)>();
            void Enumerate(int row, List<int> ids)
            {
                if (row == candidates.Length)
                {
                    var cost = (tracks.Length - ids.Count(id => id >= 0)) * .5 + ids.Count(id => id < 0) * .5;
                    for (var i = 0; i < ids.Count; i++)
                        if (ids[i] >= 0) cost += Math.Abs(candidates[i].Position.X - tracks[ids[i]].Position.X) / 40d;
                    events.Add((ids.ToArray(), Math.Exp(-cost / .15)));
                    return;
                }
                foreach (var id in new[] { -1, 0, 1, 2 })
                    if (id < 0 || (!ids.Contains(id) && Math.Abs(candidates[row].Position.X - tracks[id].Position.X) < 40))
                    { ids.Add(id); Enumerate(row + 1, ids); ids.RemoveAt(ids.Count - 1); }
            }
            Enumerate(0, new List<int>());
            var total = events.Sum(e => e.Weight);
            for (var row = 0; row < 3; row++)
            {
                for (var col = 0; col < 3; col++)
                    Assert.That(actual.Associations[row, col], Is.EqualTo(events.Where(e => e.Assignment[row] == col).Sum(e => e.Weight) / total).Within(1e-12));
                Assert.That(actual.Births[row], Is.EqualTo(events.Where(e => e.Assignment[row] < 0).Sum(e => e.Weight) / total).Within(1e-12));
            }
        }
    }

    [TestCase(false, false)]
    [TestCase(false, true)]
    [TestCase(true, false)]
    [TestCase(true, true)]
    public void MaskedIdReturnsAfterPublicationExpiryAndCacheEviction(bool kalman, bool global)
    {
        var tracker = Tracker(kalman: kalman, global: global);
        tracker.Update(new[] { Point(0), Point(10) }, 0);
        tracker.Update(new[] { Point(0), Point(10) }, .1);
        var merged = tracker.Update(new[] { Point(5) }, .2);
        var visible = merged.Interactions.Single(i => i.TrackingState != InteractionTrackingState.Lost).TouchId;
        var masked = visible == 0 ? 1 : 0;
        tracker.Update(new[] { Point(5) }, .3);
        var held = tracker.Update(new[] { Point(5) }, .5);
        Assert.That(held.Interactions.Any(i => i.TouchId == masked), Is.False, "Normal publication retention is unchanged.");
        Assert.That(tracker.OutputAt(.6).Interactions.Any(i => i.TouchId == masked), Is.False);
        Assert.That(tracker.InteractionsFramesCache.Any(f => f.Interactions.Any(i => i.TouchId == masked)), Is.False);
        var split = tracker.Update(new[] { Point(0), Point(10) }, .7);
        Assert.Multiple(() =>
        {
            Assert.That(split.Interactions.Select(i => i.TouchId), Is.EquivalentTo(new[] { 0, 1 }));
            Assert.That(split.Interactions.All(i => i.TrackingState == InteractionTrackingState.Confirmed), Is.True);
            Assert.That(tracker.CurrentMaxId, Is.EqualTo(2));
        });
    }

    [TestCase(false)]
    [TestCase(true)]
    public void CrossingRecoversTheMaskedMovingIdentity(bool kalman)
    {
        var tracker = Tracker(kalman: kalman);
        tracker.UseVelocityForMapping = true;
        tracker.Update(new[] { Point(0), Point(40) }, 0);
        tracker.Update(new[] { Point(5), Point(35) }, .1);
        tracker.Update(new[] { Point(10), Point(30) }, .2);
        tracker.Update(new[] { Point(15), Point(25) }, .3);
        tracker.Update(new[] { Point(20) }, .4);
        tracker.Update(new[] { Point(25) }, .5);
        tracker.Update(new[] { Point(30) }, .6);
        var split = tracker.Update(new[] { Point(35), Point(5) }, .7);
        var raw = tracker.InteractionsFramesCache.Single(f => f.FrameId == split.FrameId).Interactions;
        Assert.Multiple(() =>
        {
            Assert.That(raw.Single(i => i.Position.X == 35).TouchId, Is.EqualTo(0));
            Assert.That(raw.Single(i => i.Position.X == 5).TouchId, Is.EqualTo(1));
            Assert.That(tracker.CurrentMaxId, Is.EqualTo(2));
        });
    }

    [TestCase(false)]
    [TestCase(true)]
    public void OrdinaryMissingContactIsNotReservedWithoutCompetition(bool enabled)
    {
        var tracker = Tracker(enabled);
        tracker.Update(new[] { Point(0), Point(100) }, 0);
        tracker.Update(new[] { Point(0) }, .05);
        tracker.Update(new[] { Point(0) }, .2);
        var result = tracker.Update(new[] { Point(0), Point(100) }, .4);
        Assert.That(result.Interactions.Any(i => i.TouchId == 1), Is.False);
        Assert.That(tracker.CurrentMaxId, Is.EqualTo(3));
    }

    [TestCase(false)]
    [TestCase(true)]
    public void DisabledOrExpiredReservationStartsANewId(bool enabled)
    {
        var tracker = Tracker(enabled);
        tracker.Update(new[] { Point(0), Point(10) }, 0);
        tracker.Update(new[] { Point(5) }, .05);
        tracker.Update(new[] { Point(5) }, .2);
        tracker.Update(new[] { Point(5) }, .8);
        var result = tracker.Update(new[] { Point(0), Point(10) }, 1.01);
        Assert.That(tracker.CurrentMaxId, Is.EqualTo(3), "Merged observations must not extend the unassigned ID's deadline.");
        Assert.That(result.Interactions.Count(i => i.TrackingState != InteractionTrackingState.Lost), Is.EqualTo(2));
    }

    [Test]
    public void DisableResetHistoryAndSensorTimeoutDiscardReservedIds()
    {
        foreach (var action in new[] { "disable", "reset", "history", "timeout", "timeout-without-timer" })
        {
            var tracker = Tracker();
            tracker.Update(new[] { Point(0), Point(10) }, 0);
            tracker.Update(new[] { Point(5) }, .05);
            tracker.Update(new[] { Point(5) }, .2);
            if (action == "disable") tracker.UseJpda = false;
            if (action == "reset") tracker.Reset();
            if (action == "history") { tracker.NumFramesHistory = 0; tracker.NumFramesHistory = 2; }
            if (action == "timeout") { tracker.ObservationTimeoutSeconds = .1; tracker.OutputAt(.31); }
            if (action == "timeout-without-timer") tracker.ObservationTimeoutSeconds = .1;
            var result = tracker.Update(new[] { Point(0), Point(10) }, .4);
            if (action != "reset") Assert.That(tracker.CurrentMaxId, Is.GreaterThan(2), action);
            else Assert.That(result.Interactions.All(i => i.TrackingState == InteractionTrackingState.Tentative), Is.True);
        }
    }

    [Test]
    public void GateTypeAndDenseBeamRemainExclusiveAndNormalized()
    {
        var candidates = Enumerable.Range(0, 20).Select(i => Point(i % 2)).ToArray();
        var tracks = Enumerable.Range(0, 20).Select(i => (i, Point(i % 2).Position, InteractionType.Push)).ToArray();
        var result = JpdaContactAssignment.Assign(candidates, tracks, 40, .5f, .5f);
        Assert.That(result.Approximate, Is.True);
        Assert.That(result.AssignedIds.Where(id => id >= 0).Distinct().Count(), Is.EqualTo(result.AssignedIds.Count(id => id >= 0)));
        for (var row = 0; row < 20; row++)
            Assert.That(result.Births[row] + Enumerable.Range(0, 20).Sum(col => result.Associations[row, col]), Is.EqualTo(1).Within(1e-12));
        for (var col = 0; col < 20; col++)
            Assert.That(result.Misses[col] + Enumerable.Range(0, 20).Sum(row => result.Associations[row, col]), Is.EqualTo(1).Within(1e-12));
        var rejected = JpdaContactAssignment.Assign(new[] { Point(0, InteractionType.Pull), Point(40) },
            new[] { (0, Point(0).Position, InteractionType.Push) }, 40, .5f, .5f);
        Assert.That(rejected.AssignedIds, Is.EqualTo(new[] { -1, -1 }));
        Assert.That(rejected.IsMasked(0), Is.False);
    }

    [TestCase(1d, 2)]
    [TestCase(1.000001, 3)]
    public void ReservationDeadlineIsInclusive(double splitTime, int allocated)
    {
        var tracker = Tracker();
        tracker.Update(new[] { Point(0), Point(10) }, 0);
        tracker.Update(new[] { Point(5) }, .05);
        tracker.Update(new[] { Point(5) }, .2);
        tracker.Update(new[] { Point(5) }, .8);
        tracker.Update(new[] { Point(0), Point(10) }, splitTime);
        Assert.That(tracker.CurrentMaxId, Is.EqualTo(allocated));
    }

    [Test]
    public void CanonicalOrderingAndZeroCostTiesPreserveExistingIds()
    {
        var tracks = new[] { (31, Point(20).Position, InteractionType.Push), (7, Point(0).Position, InteractionType.Push) };
        var a = JpdaContactAssignment.Assign(new[] { Point(8), Point(12) }, tracks, 40, .5f, .5f);
        var b = JpdaContactAssignment.Assign(new[] { Point(12), Point(8) }, tracks.Reverse().ToArray(), 40, .5f, .5f);
        Assert.That(a.AssignedIds, Is.EqualTo(b.AssignedIds.Reverse()));
        var tie = JpdaContactAssignment.Assign(new[] { Point(20) }, tracks, 40, 0, 0);
        Assert.That(tie.AssignedIds.Single(), Is.EqualTo(31));
    }

    [Test]
    public void ManyRetainedTracksFallBackWithoutExceedingTheJointBitsetAndInvalidInputIsIgnored()
    {
        var tracker = Tracker();
        for (var frame = 0; frame < 6; frame++)
            tracker.Update(Enumerable.Range(0, 20).Select(i => Point(frame * 10000 + i * 100)).ToArray(), frame / 100d);
        Assert.That(tracker.CurrentMaxId, Is.EqualTo(120));
        var clean = Tracker();
        var output = clean.Update(new[] { Point(float.NaN), Point(float.PositiveInfinity), Point(5) }, 0);
        Assert.That(output.Interactions, Has.Count.EqualTo(1));
        Assert.That(output.Interactions.Single().Position.X, Is.EqualTo(5));
    }

    [Test]
    public void MoreThanFiveOverlappingContactsDoNotLoseEveryMaskedIdentityToAnAbsoluteThreshold()
    {
        var tracker = Tracker();
        var separated = Enumerable.Range(0, 6).Select(i => Point(i * 2)).ToArray();
        tracker.Update(separated, 0);
        tracker.Update(new[] { Point(5) }, .05);
        tracker.Update(new[] { Point(5) }, .2);
        var recovered = tracker.Update(separated, .5);
        Assert.That(recovered.Interactions.Select(i => i.TouchId), Is.EquivalentTo(Enumerable.Range(0, 6)));
        Assert.That(tracker.CurrentMaxId, Is.EqualTo(6));
    }
}
