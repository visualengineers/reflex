using System;
using System.Runtime.CompilerServices;

[assembly: InternalsVisibleTo("ReFlex.Core.Implementation")]

namespace ReFlex.Core.Common.Components
{
    /// <summary>A completed sensor observation with its own point cloud and vector field.</summary>
    public sealed class TrackingObservation
    {
        public long Sequence { get; }
        public double TimestampSeconds { get; }
        public PointCloud3 PointCloud { get; }
        public VectorField2 VectorField { get; }

        public TrackingObservation(long sequence, double timestampSeconds, PointCloud3 cloud, VectorField2 vectors)
            : this(sequence, timestampSeconds, cloud, vectors, null)
        {
        }

        // The caller owns the spare and may reuse it only after all readers have finished.
        internal TrackingObservation(long sequence, double timestampSeconds, PointCloud3 cloud, VectorField2 vectors,
            TrackingObservation spare)
        {
            if (!double.IsFinite(timestampSeconds)) throw new ArgumentOutOfRangeException(nameof(timestampSeconds));
            Sequence = sequence;
            TimestampSeconds = timestampSeconds;
            var cloudBuffer = spare?.PointCloud;
            PointCloud = CopyCloud(cloud, cloudBuffer);
            VectorField = CopyVectors(vectors, spare?.VectorField);
        }

        internal static PointCloud3 CopyCloud(PointCloud3 cloud, PointCloud3 buffer = null)
        {
            if (cloud == null) return null;
            if (buffer?.SizeX != cloud.SizeX || buffer.SizeY != cloud.SizeY)
                buffer = new PointCloud3(cloud.SizeX, cloud.SizeY);

            var source = cloud.AsArray();
            var target = buffer.AsArray();
            for (var i = 0; i < source.Length; i++)
            {
                target[i].Set(source[i]);
                target[i].IsValid = source[i].IsValid;
                target[i].IsFiltered = source[i].IsFiltered;
            }
            return buffer;
        }

        internal static VectorField2 CopyVectors(VectorField2 vectors, VectorField2 buffer = null)
        {
            if (vectors == null) return null;
            if (buffer?.SizeX != vectors.SizeX || buffer.SizeY != vectors.SizeY || buffer.Stride != vectors.Stride)
                buffer = new VectorField2(vectors.SizeX, vectors.SizeY, vectors.Stride);

            var source = vectors.AsArray();
            var target = buffer.AsArray();
            for (var i = 0; i < source.Length; i++)
            {
                target[i].Set(source[i]);
                target[i].IsValid = source[i].IsValid;
            }
            return buffer;
        }
    }
}
