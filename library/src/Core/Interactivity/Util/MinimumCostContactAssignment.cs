using System.Collections.Generic;
using System.Linq;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;

namespace ReFlex.Core.Interactivity.Util;

/// <summary>Assigns measurements to matching positions without mutating contact lifecycle state.</summary>
internal static class MinimumCostContactAssignment
{
    public static int[] Assign(List<Interaction> candidates, IReadOnlyList<(int TouchId, Point3 Position, InteractionType Type)> targets,
        float distanceLimit, float missCost, float birthCost)
    {
        var tracks = targets.OrderBy(pair => pair.TouchId).ToArray();
        // Canonical order makes equal-cost decisions independent of detector enumeration.
        var orderedCandidates = candidates.Select((candidate, index) => (Candidate: candidate, Index: index))
            .OrderBy(item => item.Candidate.Position.X)
            .ThenBy(item => item.Candidate.Position.Y)
            .ThenBy(item => item.Index).ToArray();
        var costs = new double[orderedCandidates.Length, tracks.Length + orderedCandidates.Length];
        for (var row = 0; row < orderedCandidates.Length; row++)
        {
            for (var column = 0; column < tracks.Length; column++)
            {
                var distance = Point3.Manhattan2DDistance(orderedCandidates[row].Candidate.Position,
                    tracks[column].Position);
                // The full objective includes tracks.Length * missCost. Matching a
                // track removes its miss cost; omitting that constant gives this rectangular problem.
                costs[row, column] = orderedCandidates[row].Candidate.Type == tracks[column].Type
                    && float.IsFinite(distance) && distance < distanceLimit
                    ? (double)distance / distanceLimit - missCost
                    : double.PositiveInfinity;
            }
            for (var column = tracks.Length; column < costs.GetLength(1); column++)
                costs[row, column] = column == tracks.Length + row
                    ? birthCost : double.PositiveInfinity;
        }

        var assignment = MinimumCostAssignment.Solve(costs);
        var ids = Enumerable.Repeat(-1, candidates.Count).ToArray();
        for (var row = 0; row < orderedCandidates.Length; row++)
            if (assignment[row] < tracks.Length)
                ids[orderedCandidates[row].Index] = tracks[assignment[row]].TouchId;
        return ids;
    }
}
