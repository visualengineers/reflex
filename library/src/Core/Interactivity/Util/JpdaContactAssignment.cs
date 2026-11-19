using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Runtime.CompilerServices;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using Math = System.Math;

namespace ReFlex.Core.Interactivity.Util;

/// <summary>Joint association probabilities with a hard, exclusive maximum-posterior decoder.
/// Separate validation components factor exactly. Large components use a deterministic beam;
/// probabilities then describe the retained joint events, not an exact full posterior.</summary>
internal static class JpdaContactAssignment
{
    internal const int MaxEvents = 256;
    internal const int MaxTracks = 64;
    internal const int MaxCandidates = 20;
    internal const double Temperature = .15;
    internal const double OcclusionRelativeProbability = .2;

    internal sealed class Result
    {
        public int[] AssignedIds { get; init; }
        public int[] TrackIds { get; init; }
        public double[,] Associations { get; init; }
        public double[] Births { get; init; }
        public double[] Misses { get; init; }
        public bool Approximate { get; set; }

        public bool IsMasked(int id)
        {
            var column = Array.IndexOf(TrackIds, id);
            if (column < 0 || AssignedIds.Contains(id)) return false;
            for (var row = 0; row < AssignedIds.Length; row++)
            {
                var winner = Array.IndexOf(TrackIds, AssignedIds[row]);
                // Relative odds also retain plausible IDs when more than two contacts merge;
                // an absolute .2 threshold would discard every ID in a six-way ambiguity.
                if (winner >= 0 && Associations[row, winner] > 0
                    && Associations[row, column] >= OcclusionRelativeProbability * Associations[row, winner]) return true;
            }
            return false;
        }
    }

    private struct Event
    {
        public double LogWeight;
        public ulong Used;
    }

    // Paths are materialized only after selection. Sequence preserves the original stable
    // OrderByDescending tie order, including equal weights at the beam boundary.
    private struct Branch : IComparable<Branch>
    {
        public double LogWeight;
        public int Sequence;

        public int CompareTo(Branch other)
        {
            // Scores are finite for validated finite costs and gated input distances.
            if (LogWeight > other.LogWeight) return -1;
            if (LogWeight < other.LogWeight) return 1;
            return Sequence.CompareTo(other.Sequence);
        }
    }

    // A worst-first heap retains exactly the first MaxEvents branches in the original
    // stable descending order, without allocating/sorting every discarded expansion.
    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static void Retain(Span<Branch> heap, ref int count, double score, int sequence)
    {
        // Most dense-group expansions lose at this boundary. Avoid copying a branch
        // or entering the heap for those candidates.
        if (count == heap.Length && (score < heap[0].LogWeight
            || (score == heap[0].LogWeight && sequence >= heap[0].Sequence))) return;
        var candidate = new Branch { LogWeight = score, Sequence = sequence };
        int index;
        if (count < heap.Length)
        {
            index = count++;
            while (index > 0)
            {
                var parent = (index - 1) / 2;
                if (candidate.CompareTo(heap[parent]) <= 0) break;
                heap[index] = heap[parent];
                index = parent;
            }
        }
        else
        {
            index = 0;
            while (index * 2 + 1 < count)
            {
                var child = index * 2 + 1;
                if (child + 1 < count && heap[child + 1].CompareTo(heap[child]) > 0) child++;
                if (candidate.CompareTo(heap[child]) >= 0) break;
                heap[index] = heap[child];
                index = child;
            }
        }
        heap[index] = candidate;
    }

    public static Result Assign(IReadOnlyList<Interaction> candidates,
        IReadOnlyList<(int TouchId, Point3 Position, InteractionType Type)> targets,
        float gate, float missCost, float birthCost)
    {
        if (targets.Count > MaxTracks) throw new ArgumentOutOfRangeException(nameof(targets));
        if (candidates.Count > MaxCandidates) throw new ArgumentOutOfRangeException(nameof(candidates));
        var tracks = targets.OrderBy(t => t.TouchId).ToArray();
        var order = Enumerable.Range(0, candidates.Count).OrderBy(i => candidates[i].Position.X)
            .ThenBy(i => candidates[i].Position.Y).ThenBy(i => (int)candidates[i].Type).ThenBy(i => i).ToArray();
        var costs = new double[candidates.Count, tracks.Length];
        Span<ulong> eligible = stackalloc ulong[candidates.Count];
        eligible.Clear();
        var result = new Result { AssignedIds = Enumerable.Repeat(-1, candidates.Count).ToArray(),
            TrackIds = tracks.Select(t => t.TouchId).ToArray(), Associations = new double[candidates.Count, tracks.Length],
            Births = new double[candidates.Count], Misses = Enumerable.Repeat(1d, tracks.Length).ToArray() };
        if (tracks.Length == 0) { Array.Fill(result.Births, 1); return result; }
        foreach (var row in order)
            for (var col = 0; col < tracks.Length; col++)
            {
                var distance = Point3.Manhattan2DDistance(candidates[row].Position, tracks[col].Position);
                if (candidates[row].Type == tracks[col].Type && float.IsFinite(distance) && distance < gate)
                {
                    eligible[row] |= 1UL << col;
                    // Same arithmetic as the original per-expansion expression.
                    costs[row, col] = ((double)distance / gate - missCost) / Temperature;
                }
            }

        Span<Event> events = stackalloc Event[MaxEvents];
        Span<Event> nextEvents = stackalloc Event[MaxEvents];
        Span<Branch> heap = stackalloc Branch[MaxEvents];
        Span<int> paths = stackalloc int[MaxEvents * candidates.Count];
        Span<int> nextPaths = stackalloc int[MaxEvents * candidates.Count];
        Span<double> weights = stackalloc double[MaxEvents];
        Span<int> componentRows = stackalloc int[candidates.Count];
        var birthPenalty = birthCost / Temperature;

        // Connected components in the candidate/track validation graph. Unreachable tracks
        // contribute only a constant miss weight and do not couple otherwise separate contacts.
        var remaining = (1U << candidates.Count) - 1;
        foreach (var start in order)
        {
            if ((remaining & (1U << start)) == 0) continue;
            remaining &= ~(1U << start);
            var rows = 1U << start;
            var columns = eligible[start];
            bool changed;
            do
            {
                changed = false;
                foreach (var row in order)
                {
                    if ((remaining & (1U << row)) == 0 || (eligible[row] & columns) == 0) continue;
                    remaining &= ~(1U << row);
                    rows |= 1U << row;
                    columns |= eligible[row];
                    changed = true;
                }
            } while (changed);
            if (columns == 0) { result.Births[start] = 1; continue; }
            var rowCount = 0;
            foreach (var row in order)
                if ((rows & (1U << row)) != 0) componentRows[rowCount++] = row;
            events[0] = default;
            var count = 1;
            for (var depth = 0; depth < rowCount; depth++)
            {
                var row = componentRows[depth];
                int retained = 0, expanded = 0;
                for (var parent = 0; parent < count; parent++)
                {
                    var previous = events[parent];
                    var available = eligible[row] & ~previous.Used;
                    expanded += BitOperations.PopCount(available) + 1;
                    while (available != 0)
                    {
                        var col = BitOperations.TrailingZeroCount(available);
                        available &= available - 1;
                        // A fixed-width ordinal preserves parent/column generation order even
                        // when some columns are unavailable. Birth sorts after all real columns.
                        Retain(heap, ref retained, previous.LogWeight - costs[row, col], parent * (MaxTracks + 1) + col);
                    }
                    Retain(heap, ref retained, previous.LogWeight - birthPenalty, parent * (MaxTracks + 1) + MaxTracks);
                }
                if (expanded > MaxEvents) result.Approximate = true;
                heap[..retained].Sort();
                for (var index = 0; index < retained; index++)
                {
                    var branch = heap[index];
                    var parent = branch.Sequence / (MaxTracks + 1);
                    var column = branch.Sequence % (MaxTracks + 1);
                    nextEvents[index] = new Event { LogWeight = branch.LogWeight,
                        Used = column == MaxTracks ? events[parent].Used : events[parent].Used | (1UL << column) };
                    paths.Slice(parent * candidates.Count, depth).CopyTo(nextPaths.Slice(index * candidates.Count, depth));
                    nextPaths[index * candidates.Count + depth] = column == MaxTracks ? -1 : column;
                }
                var swapEvents = events; events = nextEvents; nextEvents = swapEvents;
                var swapPaths = paths; paths = nextPaths; nextPaths = swapPaths;
                count = retained;
            }
            var maximum = events[0].LogWeight;
            var denominator = 0d;
            for (var index = 0; index < count; index++)
            {
                weights[index] = Math.Exp(events[index].LogWeight - maximum);
                denominator += weights[index];
            }
            // Publish one complete feasible event, rather than independent marginal maxima.
            // The latter can prefer two births over continuing one equally plausible track.
            for (var index = 0; index < rowCount; index++)
                if (paths[index] >= 0)
                    result.AssignedIds[componentRows[index]] = tracks[paths[index]].TouchId;
            for (var eventIndex = 0; eventIndex < count; eventIndex++)
            {
                var probability = weights[eventIndex] / denominator;
                for (var index = 0; index < rowCount; index++)
                {
                    var row = componentRows[index];
                    var col = paths[eventIndex * candidates.Count + index];
                    if (col < 0) result.Births[row] += probability;
                    else result.Associations[row, col] += probability;
                }
            }
        }
        for (var col = 0; col < tracks.Length; col++)
        {
            var matched = 0d;
            foreach (var row in order) matched += result.Associations[row, col];
            result.Misses[col] = Math.Max(0, 1 - matched);
        }

        return result;
    }
}
