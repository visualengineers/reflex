using System;

namespace ReFlex.Core.Interactivity.Util;

/// <summary>Rectangular Hungarian algorithm. Each row gets one distinct column of minimum
/// total cost. Requires at least as many columns as rows and a finite complete assignment.
/// Positive infinity excludes an edge; negative finite costs are supported.</summary>
internal static class MinimumCostAssignment
{
    public static int[] Solve(double[,] costs)
    {
        var rows = costs.GetLength(0);
        var columns = costs.GetLength(1);
        if (rows > columns)
            throw new ArgumentException("Assignment requires at least as many columns as rows.", nameof(costs));

        var rowPotential = new double[rows + 1];
        var columnPotential = new double[columns + 1];
        var matchedRow = new int[columns + 1];
        var predecessor = new int[columns + 1];
        for (var row = 1; row <= rows; row++)
        {
            matchedRow[0] = row;
            var column = 0;
            var minimum = new double[columns + 1];
            Array.Fill(minimum, double.PositiveInfinity);
            var used = new bool[columns + 1];
            do
            {
                used[column] = true;
                var currentRow = matchedRow[column];
                var delta = double.PositiveInfinity;
                var nextColumn = 0;
                for (var candidate = 1; candidate <= columns; candidate++)
                {
                    if (used[candidate])
                        continue;
                    var reducedCost = costs[currentRow - 1, candidate - 1]
                        - rowPotential[currentRow] - columnPotential[candidate];
                    if (reducedCost < minimum[candidate])
                    {
                        minimum[candidate] = reducedCost;
                        predecessor[candidate] = column;
                    }
                    // Strict comparison preserves canonical column order on ties.
                    if (minimum[candidate] < delta)
                    {
                        delta = minimum[candidate];
                        nextColumn = candidate;
                    }
                }
                if (!double.IsFinite(delta))
                    throw new ArgumentException("No finite complete assignment exists.", nameof(costs));
                for (var candidate = 0; candidate <= columns; candidate++)
                {
                    if (used[candidate])
                    {
                        rowPotential[matchedRow[candidate]] += delta;
                        columnPotential[candidate] -= delta;
                    }
                    else
                        minimum[candidate] -= delta;
                }
                column = nextColumn;
            } while (matchedRow[column] != 0);

            do
            {
                var previousColumn = predecessor[column];
                matchedRow[column] = matchedRow[previousColumn];
                column = previousColumn;
            } while (column != 0);
        }

        var assignment = new int[rows];
        for (var column = 1; column <= columns; column++)
            if (matchedRow[column] != 0)
                assignment[matchedRow[column] - 1] = column - 1;
        return assignment;
    }
}
