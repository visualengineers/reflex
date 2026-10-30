using System;
using System.Collections.Generic;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;

namespace ReFlex.Core.Interactivity.Components;

/// <summary>A request-local regular raster. Its geometry survives settings changes during an RPC.</summary>
public sealed class RemoteDepthRaster
{
    public int SensorWidth { get; }
    public int SensorHeight { get; }
    public int Width { get; }
    public int Height { get; }
    public int SampleStep { get; }
    public IReadOnlyList<float> Depths { get; }

    public RemoteDepthRaster(PointCloud3 cloud, int skip, bool completeDataSet)
    {
        if (cloud == null) throw new ArgumentNullException(nameof(cloud));
        if (skip < 0 || skip == int.MaxValue) throw new ArgumentOutOfRangeException(nameof(skip));
        SensorWidth = cloud.SizeX;
        SensorHeight = cloud.SizeY;
        if (SensorWidth <= 0 || SensorHeight <= 0) throw new ArgumentException("Empty point cloud.", nameof(cloud));
        SampleStep = skip + 1;
        Width = (SensorWidth - 1) / SampleStep + 1;
        Height = (SensorHeight - 1) / SampleStep + 1;
        var values = new float[checked(Width * Height)];
        var points = cloud.AsArray();
        for (var y = 0; y < Height; y++)
        for (var x = 0; x < Width; x++)
        {
            var point = points[y * SampleStep * SensorWidth + x * SampleStep];
            values[y * Width + x] = point != null && float.IsFinite(point.Z) &&
                (completeDataSet || (point.IsValid && !point.IsFiltered)) ? point.Z : float.NaN;
        }
        Depths = Array.AsReadOnly(values);
    }

    public bool TryGetSensorIndex(int index, out int sensorIndex)
    {
        sensorIndex = -1;
        if (index < 0 || index >= Depths.Count) return false;
        sensorIndex = (index / Width * SampleStep) * SensorWidth + index % Width * SampleStep;
        return true;
    }

    public Interaction CreateCandidate(int index, float depth, int touchId, long time)
    {
        if (!TryGetSensorIndex(index, out var sensorIndex) || !float.IsFinite(depth) || !float.IsFinite(Depths[index]))
            throw new ArgumentException("Remote candidate has an invalid index, missing sample or non-finite depth.");
        return new Interaction
        {
            TouchId = touchId, Time = time, Confidence = 1, Type = InteractionType.None,
            // Observers require lateral array coordinates, not sensor world coordinates.
            Position = new Point3(sensorIndex % SensorWidth, sensorIndex / SensorWidth, depth)
        };
    }
}
