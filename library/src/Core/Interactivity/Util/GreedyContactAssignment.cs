using System.Collections.Generic;
using System.Linq;
using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Interactivity.Util;

/// <summary>Assigns measurements to matching positions without mutating contact lifecycle state.</summary>
internal static class GreedyContactAssignment
{
    public static int[] Assign(List<Interaction> candidates, IReadOnlyList<(int TouchId, Point3 Position)> targets,
        float distanceLimit)
    {
        // Preserve the previous algorithm, including its gate and deterministic pair ordering.
        var pairs = candidates.SelectMany((candidate, index) => targets.Select(track => new
            {
                CandidateIndex = index,
                TouchId = track.TouchId,
                Distance = Point3.Squared2DDistance(candidate.Position, track.Position)
            }))
            .Where(pair => pair.Distance < distanceLimit)
            .OrderBy(pair => pair.Distance)
            .ThenBy(pair => pair.TouchId)
            .ThenBy(pair => candidates[pair.CandidateIndex].Position.X)
            .ThenBy(pair => candidates[pair.CandidateIndex].Position.Y)
            .ThenBy(pair => pair.CandidateIndex);
        var ids = Enumerable.Repeat(-1, candidates.Count).ToArray();
        var assignedTracks = new HashSet<int>();
        foreach (var pair in pairs)
            if (ids[pair.CandidateIndex] < 0 && assignedTracks.Add(pair.TouchId))
                ids[pair.CandidateIndex] = pair.TouchId;
        return ids;
    }
}
