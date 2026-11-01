using System;

namespace ReFlex.Core.Common.Components
{
    /// <summary>A completed sensor observation. Owns copies of both rasters, taken after filtering
    /// and vector calculation. TimestampSeconds is monotonic acquisition/arrival time, never processing time.</summary>
    public sealed class TrackingObservation
    {
        public long Sequence { get; }
        public double TimestampSeconds { get; }
        public PointCloud3 PointCloud { get; }
        public VectorField2 VectorField { get; }

        public TrackingObservation(long sequence, double timestampSeconds, PointCloud3 cloud, VectorField2 vectors)
        {
            if (!double.IsFinite(timestampSeconds)) throw new ArgumentOutOfRangeException(nameof(timestampSeconds));
            Sequence = sequence;
            TimestampSeconds = timestampSeconds;
            PointCloud = new PointCloud3(cloud.SizeX, cloud.SizeY);
            for (var i = 0; i < cloud.Size; i++)
            {
                PointCloud[i] = cloud[i];
                PointCloud[i].IsValid = cloud[i].IsValid;
                PointCloud[i].IsFiltered = cloud[i].IsFiltered;
            }
            if (vectors == null) return;
            VectorField = new VectorField2(vectors.SizeX, vectors.SizeY, vectors.Stride);
            for (var i = 0; i < vectors.Size; i++)
            {
                VectorField[i] = vectors[i];
                VectorField[i].IsValid = vectors[i].IsValid;
            }
        }
    }
}
