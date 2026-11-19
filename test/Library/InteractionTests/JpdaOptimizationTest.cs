using System;
using System.Linq;
using NUnit.Framework;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Util;

namespace InteractionTests;

public class JpdaOptimizationTest
{
    [TestCase(0, 0)]
    [TestCase(0, 4)]
    [TestCase(4, 0)]
    [TestCase(1, 2)]
    [TestCase(3, 3)]
    [TestCase(6, 6)]
    [TestCase(10, 10)]
    [TestCase(20, 20)]
    [TestCase(20, 64)]
    public void OptimizedBeamPreservesReferenceOutputsProbabilitiesAndMaskDecisions(int measurements, int targets)
    {
        var random = new Random(3512 + measurements * 100 + targets);
        var examples = measurements >= 20 ? 4 : measurements >= 6 ? 12 : 32;
        for (var example = 0; example < examples; example++)
        {
            // Dense groups, separated components, exact ties, mixed types and zero/fractional
            // costs cover stable ordering and pruning without weakening numerical tolerances.
            var spread = example % 3 == 0 ? 1 : example % 3 == 1 ? 15 : 200;
            Point3 Position() => new(random.Next(spread) / 3f, random.Next(spread) / 7f, -.5f);
            InteractionType Type() => example % 2 == 0 || random.Next(2) == 0 ? InteractionType.Push : InteractionType.Pull;
            var candidates = Enumerable.Range(0, measurements).Select(_ => new Interaction(Position(), Type(), 20)).ToArray();
            var tracks = Enumerable.Range(0, targets).Select(i => (TouchId: 5 + i * 7, Position: Position(), Type: Type()))
                .OrderBy(_ => random.Next()).ToArray();
            var miss = example % 4 == 0 ? 0 : example % 4 == 1 ? .25f : .5f;
            var birth = example % 4 == 0 ? 0 : example % 4 == 2 ? 1.25f : .5f;
            var expected = JpdaContactAssignmentReference.Assign(candidates, tracks, 40, miss, birth);
            var actual = JpdaContactAssignment.Assign(candidates, tracks, 40, miss, birth);
            Assert.Multiple(() =>
            {
                Assert.That(actual.AssignedIds, Is.EqualTo(expected.AssignedIds), $"example {example}");
                Assert.That(actual.TrackIds, Is.EqualTo(expected.TrackIds));
                Assert.That(actual.Approximate, Is.EqualTo(expected.Approximate));
                Assert.That(actual.Births, Is.EqualTo(expected.Births), "Bit-exact birth marginals");
                Assert.That(actual.Misses, Is.EqualTo(expected.Misses), "Bit-exact miss marginals");
                Assert.That(actual.Associations, Is.EqualTo(expected.Associations), "Bit-exact association marginals");
                foreach (var track in tracks)
                    Assert.That(actual.IsMasked(track.TouchId), Is.EqualTo(expected.IsMasked(track.TouchId)));
            });
        }
    }

    [Test]
    public void RepeatedTiesAtTheBeamBoundaryRetainTheOriginalStableOrder()
    {
        var candidates = Enumerable.Range(0, 20).Select(_ => new Interaction(new Point3(1, 1, -.5f), InteractionType.Push, 20)).ToArray();
        var targets = Enumerable.Range(0, 20).Select(i => (i, new Point3(1, 1, -.5f), InteractionType.Push)).ToArray();
        foreach (var cost in new[] { 0f, .5f })
        {
            var expected = JpdaContactAssignmentReference.Assign(candidates, targets, 40, cost, cost);
            var actual = JpdaContactAssignment.Assign(candidates, targets, 40, cost, cost);
            Assert.That(actual.AssignedIds, Is.EqualTo(expected.AssignedIds));
            Assert.That(actual.Associations, Is.EqualTo(expected.Associations));
            Assert.That(actual.Births, Is.EqualTo(expected.Births));
            Assert.That(actual.Misses, Is.EqualTo(expected.Misses));
        }
    }

    [Test]
    public void FixedStackStorageEnforcesTheExistingProductionCandidateLimit()
    {
        var candidates = Enumerable.Range(0, 21).Select(_ => new Interaction(new Point3(), InteractionType.Push, 1)).ToArray();
        Assert.Throws<ArgumentOutOfRangeException>(() => JpdaContactAssignment.Assign(candidates,
            Array.Empty<(int, Point3, InteractionType)>(), 40, .5f, .5f));
    }

    [Test]
    public void DenseGroupsAllocateLessThanAQuarterOfTheReferenceMemory()
    {
        var candidates = Enumerable.Range(0, 20).Select(_ => new Interaction(new Point3(1, 1, -.5f), InteractionType.Push, 20)).ToArray();
        var targets = Enumerable.Range(0, 20).Select(i => (i, new Point3(1, 1, -.5f), InteractionType.Push)).ToArray();
        for (var warmup = 0; warmup < 3; warmup++)
        {
            JpdaContactAssignmentReference.Assign(candidates, targets, 40, .5f, .5f);
            JpdaContactAssignment.Assign(candidates, targets, 40, .5f, .5f);
        }
        var before = GC.GetAllocatedBytesForCurrentThread();
        var reference = JpdaContactAssignmentReference.Assign(candidates, targets, 40, .5f, .5f);
        var referenceBytes = GC.GetAllocatedBytesForCurrentThread() - before;
        before = GC.GetAllocatedBytesForCurrentThread();
        var optimized = JpdaContactAssignment.Assign(candidates, targets, 40, .5f, .5f);
        var optimizedBytes = GC.GetAllocatedBytesForCurrentThread() - before;
        GC.KeepAlive(reference);
        GC.KeepAlive(optimized);
        TestContext.Out.WriteLine($"Dense 20-contact managed allocations: {referenceBytes} -> {optimizedBytes} bytes");
        Assert.That(optimizedBytes, Is.LessThan(referenceBytes / 4));
    }
}
