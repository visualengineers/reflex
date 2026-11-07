using System;
using System.Collections.Generic;
using System.Linq;
using ReFlex.Core.Common.Components;
using Math = System.Math;

namespace ReFlex.Core.Interactivity.Components;

/// <summary>Combines nearby, already classified extrema into one pressure measurement before tracking.</summary>
public static class ExtremumConsolidator
{
    public const float DefaultRadius = 3;
    public const float MaxRadius = 32;

    public static float ValidateRadius(float radius) => float.IsFinite(radius) && radius >= 0 && radius <= MaxRadius
        ? radius : throw new ArgumentOutOfRangeException(nameof(radius), "Extremum merge radius must be between 0 and 32 pixels.");

    public static IList<Interaction> Consolidate(IList<Interaction> candidates, float radius)
    {
        ValidateRadius(radius);
        if (radius == 0 || candidates.Count < 2)
            return candidates;

        // Strongest pressure seeds first, independent of Parallel.For's arrival order. Buckets keep
        // neighbourhood searches local even before the tracker's candidate limit is applied.
        var ordered = candidates.OrderByDescending(i => Math.Abs(i.Position.Z))
            .ThenByDescending(i => i.ExtremumDescription?.PercentageFittingPoints ?? 0)
            .ThenBy(i => i.Type).ThenBy(i => i.Position.X).ThenBy(i => i.Position.Y).ToArray();
        (int X, int Y) Cell(Point3 p) => ((int)Math.Floor(p.X / radius), (int)Math.Floor(p.Y / radius));
        var cells = ordered.Select((item, index) => (item, index)).GroupBy(pair => Cell(pair.item.Position))
            .ToDictionary(group => group.Key, group => group.Select(pair => pair.index).ToArray());
        var assigned = new bool[ordered.Length];
        var result = new List<Interaction>();
        for (var index = 0; index < ordered.Length; index++)
        {
            if (assigned[index]) continue;
            var seed = ordered[index];
            var cell = Cell(seed.Position);
            var members = new List<int>();
            for (var x = cell.X - 1; x <= cell.X + 1; x++)
            for (var y = cell.Y - 1; y <= cell.Y + 1; y++)
            {
                if (!cells.TryGetValue((x, y), out var neighbours)) continue;
                foreach (var neighbour in neighbours)
                {
                    if (assigned[neighbour] || ordered[neighbour].Type != seed.Type) continue;
                    var point = ordered[neighbour].Position;
                    var dx = point.X - seed.Position.X;
                    var dy = point.Y - seed.Position.Y;
                    // Always relative to the seed: a chain of weak extrema cannot bridge fingers.
                    if (dx * dx + dy * dy <= radius * radius) members.Add(neighbour);
                }
            }

            var measurement = new Interaction(seed);
            double total = 0, sumX = 0, sumY = 0;
            foreach (var member in members.OrderBy(i => i))
            {
                assigned[member] = true;
                var candidate = ordered[member];
                var weight = Math.Max(1e-6, Math.Abs(candidate.Position.Z));
                total += weight;
                sumX += weight * candidate.Position.X;
                sumY += weight * candidate.Position.Y;
                measurement.Confidence = Math.Max(measurement.Confidence, candidate.Confidence);
            }
            // Subpixel centre avoids alternating between equal adjacent peaks. Keep the strongest
            // measured depth/type/quality; duplicates never multiply confidence or weaken pressure.
            measurement.Position.X = (float)(sumX / total);
            measurement.Position.Y = (float)(sumY / total);
            result.Add(measurement);
        }
        return result;
    }
}
