using ReFlex.Core.Common.Components;

namespace PointCloud.Benchmark.Util;

public class DataLoader
{
    private static string[] FileNames = new[]
    {
        @"Resources/4.csv",
        @"Resources/5.csv"
    };

    public static Tuple<int, int, Point3[]> Load(int index = 1)
    {
        var lines = File.ReadAllLines(FileNames[index]);
        var maxRow = 0;
        var maxCol = 0;

        var points = new Point3[lines.Length - 1];
        
        for (var l = 0; l < lines.Length; l++)
        {
            if (l == 0)
                continue;
            var line = lines[l];
            var columns = line.Split(',');

            var x = float.Parse(columns[0]);
            var y = float.Parse(columns[1]);
            var z = float.Parse(columns[2]);

            var column = int.Parse(columns[3]);
            var row = int.Parse(columns[4]);
            var isValid = Equals(columns[5], "True");
            var isFiltered = Equals(columns[5], "False");

            if (column > maxCol)
                maxCol = column;
            
            if (row > maxRow)
                maxRow = row;

            var p = new Point3(x, y, z);
            p.IsValid = isValid;
            p.IsFiltered = isFiltered;

            points[l - 1] = p;
        }

        return new Tuple<int, int, Point3[]>(maxCol + 1, maxRow +1, points);
    }
}