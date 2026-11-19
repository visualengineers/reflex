using System;
using Math = System.Math;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Util;

namespace InteractionTests;

/// <summary>
/// Deterministic contact scenarios. Each Step is one processed depth frame (including empty ones).
/// X coordinates describe movement; Y and depth are constant unless a test needs otherwise.
/// Assertions use IDs captured at birth rather than depending on their numeric allocation.
/// See CONTACT_TRACKING_TESTS.md for the lifecycle contract and extension guidelines.
/// </summary>
public class ContactTrackingRegressionTest
{
    private sealed class Scenario
    {
        public InteractionSmoothingBehaviour Tracker { get; }
        private int _frame;

        public Scenario(int gap = 2, int history = 10)
        {
            Tracker = new InteractionSmoothingBehaviour(history)
            {
                ContactRetentionSeconds = gap,
                MaxConfidence = 20,
                TouchMergeDistance2D = 64
            };
        }

        public InteractionFrame Step(params float[] positions)
        {
            _frame++;
            return Tracker.Update(positions.Select(x => new Interaction(new Point3(x, 10, -.5f),
                InteractionType.Push, 0) { Time = _frame }).ToList(), _frame);
        }
    }

    private static Interaction At(InteractionFrame frame, float x) =>
        frame.Interactions.Single(i => i.Position.X == x && i.TrackingState != InteractionTrackingState.Lost);

    [TestCase(false)]
    [TestCase(true)]
    public void CompetingCandidatesUseDistinctTracksRegardlessOfInputOrder(bool reverse)
    {
        var scene = new Scenario();
        var born = scene.Step(0, 20);
        // Both detections prefer track 0. The closer one wins; the other uses track 20.
        var frame = reverse ? scene.Step(9, 8) : scene.Step(8, 9);
        Assert.Multiple(() =>
        {
            Assert.That(frame.Interactions, Has.Count.EqualTo(2));
            Assert.That(At(frame, 8).TouchId, Is.EqualTo(At(born, 0).TouchId));
            Assert.That(At(frame, 9).TouchId, Is.EqualTo(At(born, 20).TouchId));
        });
    }

    [TestCase(false)]
    [TestCase(true)]
    public void GlobalAssignmentAvoidsGreedyFragmentation(bool reverse)
    {
        var scene = new Scenario();
        scene.Tracker.TouchMergeDistance2D = 81;
        var born = scene.Step(0, 100);
        var maxId = scene.Tracker.CurrentMaxId;
        var frame = reverse ? scene.Step(120, 80) : scene.Step(80, 120);
        Assert.Multiple(() =>
        {
            Assert.That(frame.Interactions, Has.Count.EqualTo(2));
            Assert.That(At(frame, 80).TouchId, Is.EqualTo(At(born, 0).TouchId));
            Assert.That(At(frame, 120).TouchId, Is.EqualTo(At(born, 100).TouchId));
            Assert.That(frame.Interactions.All(item => item.TrackingState == InteractionTrackingState.Confirmed), Is.True);
            Assert.That(scene.Tracker.CurrentMaxId, Is.EqualTo(maxId), "No replacement ID was allocated.");
        });
    }

    [TestCase(false)]
    [TestCase(true)]
    public void GlobalAssignmentMinimizesTotalDistanceEvenWhenGreedyWouldMatchBoth(bool reverse)
    {
        var scene = new Scenario();
        scene.Tracker.TouchMergeDistance2D = 10;
        var born = scene.Step(0, 4);
        var frame = reverse ? scene.Step(7, 3) : scene.Step(3, 7);
        Assert.Multiple(() =>
        {
            Assert.That(At(frame, 3).TouchId, Is.EqualTo(At(born, 0).TouchId));
            Assert.That(At(frame, 7).TouchId, Is.EqualTo(At(born, 4).TouchId));
        });
    }

    [TestCase(.1f, .1f, false)]
    [TestCase(.1f, .5f, true)]
    [TestCase(.5f, .1f, true)]
    [TestCase(0f, 0f, false)]
    public void ExplicitMissAndBirthCostsDetermineWhetherToContinueAnAllowedPair(
        float missCost, float birthCost, bool continued)
    {
        var scene = new Scenario();
        scene.Tracker.TouchMergeDistance2D = 10;
        scene.Tracker.AssignmentMissCost = missCost;
        scene.Tracker.AssignmentBirthCost = birthCost;
        var born = At(scene.Step(0), 0);
        var frame = scene.Step(5); // Match cost .5; replacement cost miss + birth.
        Assert.That(At(frame, 5).TouchId == born.TouchId, Is.EqualTo(continued));
        if (!continued)
        {
            Assert.Multiple(() =>
            {
                Assert.That(frame.Interactions.Single(item => item.TouchId == born.TouchId).TrackingState,
                    Is.EqualTo(InteractionTrackingState.Lost));
                Assert.That(At(frame, 5).TrackingState, Is.EqualTo(InteractionTrackingState.Tentative));
            });
            scene.Tracker.AssignmentMissCost = .5f;
            scene.Tracker.AssignmentBirthCost = .5f;
            Assert.That(At(scene.Step(0, 5), 0).TouchId, Is.EqualTo(born.TouchId),
                "Leaving a track unmatched must preserve its ordinary recovery lifecycle.");
        }
    }

    [TestCase(9.999f, true)]
    [TestCase(10f, false)]
    [TestCase(10.001f, false)]
    public void GlobalAssignmentPreservesStrictGateEvenWithHighMissAndBirthCosts(float x, bool continued)
    {
        var scene = new Scenario();
        scene.Tracker.TouchMergeDistance2D = 10;
        scene.Tracker.AssignmentMissCost = 100;
        scene.Tracker.AssignmentBirthCost = 100;
        var id = At(scene.Step(0), 0).TouchId;
        Assert.That(At(scene.Step(x), x).TouchId == id, Is.EqualTo(continued));
    }

    [TestCase(-1f)]
    [TestCase(float.NaN)]
    [TestCase(float.PositiveInfinity)]
    [TestCase(float.NegativeInfinity)]
    public void AssignmentCostsRejectInvalidValues(float cost)
    {
        var scene = new Scenario();
        Assert.Multiple(() =>
        {
            Assert.Throws<ArgumentOutOfRangeException>(() => scene.Tracker.AssignmentMissCost = cost);
            Assert.Throws<ArgumentOutOfRangeException>(() => scene.Tracker.AssignmentBirthCost = cost);
        });
    }

    [Test]
    public void GlobalAssignmentMatchesExhaustiveMinimumForSmallRectangularProblems()
    {
        var random = new Random(3512);
        for (var trackCount = 0; trackCount <= 4; trackCount++)
        for (var candidateCount = 0; candidateCount <= 4; candidateCount++)
        for (var sample = 0; sample < 4; sample++)
        {
            var scene = new Scenario();
            scene.Tracker.TouchMergeDistance2D = 30;
            scene.Tracker.AssignmentMissCost = .1f + sample * .2f;
            scene.Tracker.AssignmentBirthCost = .2f;
            var oldPositions = Enumerable.Range(0, trackCount).Select(i => (float)(random.Next(8) * 10 + i)).ToArray();
            var positions = Enumerable.Range(0, candidateCount).Select(i => (float)(random.Next(8) * 10 + i)).ToArray();
            var born = scene.Step(oldPositions);
            var original = born.Interactions.ToDictionary(item => item.TouchId, item => item.Position.X);
            var frame = scene.Step(positions.Reverse().ToArray());
            var used = new bool[trackCount];
            // Independent oracle enumerates every partial matching, including births and misses.
            double Minimum(int index)
            {
                if (index == positions.Length)
                    return used.Count(value => !value) * (double)scene.Tracker.AssignmentMissCost;
                var best = scene.Tracker.AssignmentBirthCost + Minimum(index + 1);
                for (var track = 0; track < trackCount; track++)
                {
                    var distance = Math.Abs(positions[index] - oldPositions[track]);
                    if (used[track] || distance >= 30)
                        continue;
                    used[track] = true;
                    best = Math.Min(best, distance / 30.0 + Minimum(index + 1));
                    used[track] = false;
                }
                return best;
            }

            var measured = frame.Interactions.Where(item => item.TrackingState != InteractionTrackingState.Lost).ToArray();
            var continuedIds = measured.Where(item => original.ContainsKey(item.TouchId)).Select(item => item.TouchId).ToArray();
            var actual = (trackCount - continuedIds.Length) * (double)scene.Tracker.AssignmentMissCost
                + measured.Sum(item => original.TryGetValue(item.TouchId, out var x)
                    ? Math.Abs(item.Position.X - x) / 30.0 : scene.Tracker.AssignmentBirthCost);
            Assert.Multiple(() =>
            {
                Assert.That(measured, Has.Length.EqualTo(candidateCount));
                Assert.That(continuedIds.Distinct().Count(), Is.EqualTo(continuedIds.Length));
                Assert.That(actual, Is.EqualTo(Minimum(0)).Within(1e-7),
                    $"tracks={trackCount}, candidates={candidateCount}, sample={sample}");
            });
        }
    }

    [Test]
    public void ExtraCandidateStartsNewTrackInsteadOfBeingDiscarded()
    {
        var scene = new Scenario();
        var id = At(scene.Step(0), 0).TouchId;
        var frame = scene.Step(1, 2);
        Assert.Multiple(() =>
        {
            Assert.That(frame.Interactions, Has.Count.EqualTo(2));
            Assert.That(At(frame, 1).TouchId, Is.EqualTo(id));
            Assert.That(At(frame, 2).TouchId, Is.Not.EqualTo(id));
            Assert.That(At(frame, 2).TrackingState, Is.EqualTo(InteractionTrackingState.Tentative));
        });
    }

    [Test]
    public void MovingContactsUseLatestPositionsRatherThanOldestHistory()
    {
        var scene = new Scenario();
        var born = scene.Step(0, 20);
        scene.Step(10, 30);
        var frame = scene.Step(11, 31);
        Assert.Multiple(() =>
        {
            Assert.That(At(frame, 11).TouchId, Is.EqualTo(At(born, 0).TouchId));
            Assert.That(At(frame, 31).TouchId, Is.EqualTo(At(born, 20).TouchId));
        });
    }

    [TestCase(0)]
    [TestCase(1)]
        public void ReappearanceWithinGapRetainsId(int emptyFrames)
    {
        var scene = new Scenario(gap: 2);
        var birth = At(scene.Step(10), 10);
        Assert.That(birth.TrackingState, Is.EqualTo(InteractionTrackingState.Tentative));
        for (var i = 0; i < emptyFrames; i++)
        {
            var lost = scene.Step().Interactions.Single();
            Assert.Multiple(() =>
            {
                Assert.That(lost.TrackingState, Is.EqualTo(InteractionTrackingState.Lost));
                Assert.That(lost.TouchId, Is.EqualTo(birth.TouchId));
                Assert.That(lost.Time, Is.EqualTo(birth.Time), "A held position is not a new measurement.");
            });
        }
        var returned = At(scene.Step(11), 11);
        Assert.Multiple(() =>
        {
            Assert.That(returned.TouchId, Is.EqualTo(birth.TouchId));
            Assert.That(returned.TrackingState, Is.EqualTo(InteractionTrackingState.Confirmed));
        });
    }

    [TestCase(0)]
    [TestCase(2)]
    public void ExpiredContactCannotBeResurrectedEvenIfGapIsIncreased(int gap)
    {
        var scene = new Scenario(gap);
        var oldId = At(scene.Step(10), 10).TouchId;
        for (var i = 0; i < gap; i++) scene.Step();
        Assert.That(scene.Step().Interactions, Is.Empty);
        Assert.That(scene.Tracker.InteractionsFramesCache.SelectMany(f => f.Interactions)
            .Any(i => i.TouchId == oldId), Is.True, "Expiry must not depend on cache eviction.");
        scene.Tracker.ContactRetentionSeconds = 8;
        Assert.That(At(scene.Step(10), 10).TouchId, Is.Not.EqualTo(oldId));
    }

    [Test]
    public void LossOfOneContactDoesNotInterruptTheOther()
    {
        var scene = new Scenario(gap: 1);
        var born = scene.Step(0, 100);
        scene.Step(101);
        var frame = scene.Step(102);
        Assert.Multiple(() =>
        {
            Assert.That(frame.Interactions, Has.Count.EqualTo(1));
            Assert.That(At(frame, 102).TouchId, Is.EqualTo(At(born, 100).TouchId));
        });
        var returned = scene.Step(0, 103);
        Assert.That(At(returned, 0).TouchId, Is.Not.EqualTo(At(born, 0).TouchId));
    }

    [Test]
    public void ApproachingContactsCanMergeBrieflyAndSeparateWithoutLosingIds()
    {
        var scene = new Scenario(gap: 2);
        var born = scene.Step(0, 20);
        scene.Step(8, 12);
        var merged = scene.Step(10);
        Assert.Multiple(() =>
        {
            Assert.That(merged.Interactions, Has.Count.EqualTo(2));
            Assert.That(merged.Interactions.Count(i => i.TrackingState == InteractionTrackingState.Lost), Is.EqualTo(1));
            Assert.That(merged.Interactions.Select(i => i.TouchId).Distinct().Count(), Is.EqualTo(2));
        });
        var separated = scene.Step(9, 13);
        Assert.Multiple(() =>
        {
            Assert.That(At(separated, 9).TouchId, Is.EqualTo(At(born, 0).TouchId));
            Assert.That(At(separated, 13).TouchId, Is.EqualTo(At(born, 20).TouchId));
        });
    }

    [Test]
    public void CrossingObservationsRemainDistinctButFollowProximityWithoutMotionPrediction()
    {
        var scene = new Scenario();
        var born = scene.Step(0, 20);
        scene.Step(8, 12);
        // Physical fingers may have crossed (8 -> 12 and 12 -> 8). Without velocity,
        // these observations are indistinguishable from stationary fingers in reversed input order.
        var crossed = scene.Step(12, 8);
        Assert.Multiple(() =>
        {
            Assert.That(crossed.Interactions, Has.Count.EqualTo(2));
            Assert.That(At(crossed, 8).TouchId, Is.EqualTo(At(born, 0).TouchId));
            Assert.That(At(crossed, 12).TouchId, Is.EqualTo(At(born, 20).TouchId));
        });
    }

    [Test]
    public void ZeroHistoryPublishesFreshContactsWithoutRetainingTracks()
    {
        var scene = new Scenario(history: 0);
        var first = At(scene.Step(10), 10);
        var second = At(scene.Step(10), 10);
        Assert.Multiple(() =>
        {
            Assert.That(second.TouchId, Is.Not.EqualTo(first.TouchId));
            Assert.That(scene.Tracker.InteractionsFramesCache, Is.Empty);
            Assert.That(scene.Step().Interactions, Is.Empty);
        });
    }

    [Test]
    public void ResetRemovesTracksAndHistory()
    {
        var scene = new Scenario();
        scene.Step(10);
        scene.Step(10);
        scene.Tracker.Reset();
        var contact = At(scene.Step(100), 100);
        Assert.Multiple(() =>
        {
            Assert.That(contact.TouchId, Is.Zero);
            Assert.That(contact.TrackingState, Is.EqualTo(InteractionTrackingState.Tentative));
            Assert.That(scene.Tracker.InteractionsFramesCache, Has.Length.EqualTo(1));
        });
    }

    [TestCase(FilterType.None, 1)]
    [TestCase(FilterType.MovingAverage, 1)]
    [TestCase(FilterType.MovingAverage, 5)]
    [TestCase(FilterType.PolynomialFit, 1)]
    [TestCase(FilterType.SavitzkyGolay, 1)]
    public void SmoothingAndPublishedSnapshotsNeverMutateMeasurements(FilterType filter, int samples)
    {
        var scene = new Scenario();
        scene.Tracker.NumFramesSmoothing = samples;
        scene.Tracker.DepthScale = 100;
        scene.Tracker.UpdateFilterType(filter);
        var input = new Interaction(new Point3(10, 10, -.5f), InteractionType.Push, 0);
        InteractionFrame output = null;
        for (var i = 0; i < samples; i++) output = scene.Tracker.Update(new[] { input }, i + 1);
        Assert.Multiple(() =>
        {
            Assert.That(input.TouchId, Is.EqualTo(-1));
            Assert.That(input.Position.Z, Is.EqualTo(-.5f));
            Assert.That(output.Interactions.Single().Position.Z, Is.EqualTo(-.5f).Within(.00001));
            Assert.That(scene.Tracker.InteractionsFramesCache.SelectMany(f => f.Interactions)
                .All(i => i.Position.Z == -.5f), Is.True);
        });
        // Mutate every outward-facing copy. Neither matching nor future smoothing may observe this.
        output.Interactions.Single().Position.X = 999;
        input.Position.X = 888;
        var snapshot = scene.Tracker.InteractionsFramesCache;
        snapshot[0].Interactions[0].Position.X = 777;
        snapshot[0].Interactions[0].ExtremumDescription.NumFittingPoints = 999;
        snapshot[0].Interactions.Clear();
        var next = At(scene.Tracker.Update(new[] { new Interaction(new Point3(10, 10, -.5f), InteractionType.Push, 0) }, samples + 1), 10);
        Assert.That(next.TouchId, Is.Zero);
        Assert.That(scene.Tracker.InteractionsFramesCache.SelectMany(f => f.Interactions)
            .All(i => i.Position.X == 10 && i.ExtremumDescription.NumFittingPoints == 0), Is.True);
    }
}
