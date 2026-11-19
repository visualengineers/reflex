// Behavioral reference from 4290171a, library/src/Core/Interactivity/Util/JpdaContactAssignment.cs
// Original SHA-256: acf6b1d0487635894bf307e3299aab07dc34286f3a401e168ca5aad8fd36cb6d
// Only the class name is changed; keep the original algorithm for differential tests.
using System;
using System.Collections.Generic;
using System.Linq;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using Math = System.Math;

namespace ReFlex.Core.Interactivity.Util;

/// <summary>Joint association probabilities with a hard, exclusive maximum-posterior decoder.
/// Separate validation components factor exactly. Large components use a deterministic beam;
/// probabilities then describe the retained joint events, not an exact full posterior.</summary>
internal static class JpdaContactAssignmentReference
{
    internal const int MaxEvents = 256;
    internal const int MaxTracks = 64;
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

    private sealed record Event(double LogWeight, ulong Used, int[] Columns);

    public static Result Assign(IReadOnlyList<Interaction> candidates,
        IReadOnlyList<(int TouchId, Point3 Position, InteractionType Type)> targets,
        float gate, float missCost, float birthCost)
    {
        if (targets.Count > MaxTracks) throw new ArgumentOutOfRangeException(nameof(targets));
        var tracks = targets.OrderBy(t => t.TouchId).ToArray();
        var order = Enumerable.Range(0, candidates.Count).OrderBy(i => candidates[i].Position.X)
            .ThenBy(i => candidates[i].Position.Y).ThenBy(i => (int)candidates[i].Type).ThenBy(i => i).ToArray();
        var distances = new double[candidates.Count, tracks.Length];
        var result = new Result { AssignedIds = Enumerable.Repeat(-1, candidates.Count).ToArray(),
            TrackIds = tracks.Select(t => t.TouchId).ToArray(), Associations = new double[candidates.Count, tracks.Length],
            Births = new double[candidates.Count], Misses = Enumerable.Repeat(1d, tracks.Length).ToArray() };
        foreach (var row in order)
            for (var col = 0; col < tracks.Length; col++)
            {
                var distance = Point3.Manhattan2DDistance(candidates[row].Position, tracks[col].Position);
                distances[row, col] = candidates[row].Type == tracks[col].Type && float.IsFinite(distance) && distance < gate
                    ? (double)distance / gate : double.PositiveInfinity;
            }

        // Connected components in the candidate/track validation graph. Unreachable tracks
        // contribute only a constant miss weight and do not couple otherwise separate contacts.
        var remaining = new HashSet<int>(order);
        foreach (var start in order)
        {
            if (!remaining.Remove(start)) continue;
            var rows = new HashSet<int> { start };
            var columns = new HashSet<int>();
            var queue = new Queue<int>();
            queue.Enqueue(start);
            while (queue.Count > 0)
            {
                var row = queue.Dequeue();
                for (var col = 0; col < tracks.Length; col++)
                {
                    if (!double.IsFinite(distances[row, col]) || !columns.Add(col)) continue;
                    foreach (var other in order)
                        if (double.IsFinite(distances[other, col]) && remaining.Remove(other))
                        { rows.Add(other); queue.Enqueue(other); }
                }
            }
            var componentRows = order.Where(rows.Contains).ToArray();
            var componentColumns = columns.Order().ToArray();
            var events = new List<Event> { new(0, 0, Array.Empty<int>()) };
            foreach (var row in componentRows)
            {
                var next = new List<Event>();
                foreach (var previous in events)
                {
                    foreach (var col in componentColumns)
                        if ((previous.Used & (1UL << col)) == 0 && double.IsFinite(distances[row, col]))
                            // The omitted constant is -tracks.Count * missCost / Temperature.
                            next.Add(new Event(previous.LogWeight - (distances[row, col] - missCost) / Temperature,
                                previous.Used | (1UL << col), previous.Columns.Append(col).ToArray()));
                    next.Add(new Event(previous.LogWeight - birthCost / Temperature, previous.Used,
                        previous.Columns.Append(-1).ToArray()));
                }
                if (next.Count > MaxEvents) result.Approximate = true;
                // Stable ordering resolves exact ties in canonical candidate/TouchId order.
                events = next.OrderByDescending(e => e.LogWeight).Take(MaxEvents).ToList();
            }
            var maximum = events.Max(e => e.LogWeight);
            var denominator = events.Sum(e => Math.Exp(e.LogWeight - maximum));
            // Publish one complete feasible event, rather than independent marginal maxima.
            // The latter can prefer two births over continuing one equally plausible track.
            var best = events[0];
            for (var index = 0; index < componentRows.Length; index++)
                if (best.Columns[index] >= 0)
                    result.AssignedIds[componentRows[index]] = tracks[best.Columns[index]].TouchId;
            foreach (var hypothesis in events)
            {
                var probability = Math.Exp(hypothesis.LogWeight - maximum) / denominator;
                for (var index = 0; index < componentRows.Length; index++)
                {
                    var row = componentRows[index];
                    var col = hypothesis.Columns[index];
                    if (col < 0) result.Births[row] += probability;
                    else result.Associations[row, col] += probability;
                }
            }
        }
        for (var col = 0; col < tracks.Length; col++)
            result.Misses[col] = Math.Max(0, 1 - order.Sum(row => result.Associations[row, col]));

        return result;
    }
}
