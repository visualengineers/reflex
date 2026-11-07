using System;
using System.Diagnostics;
using System.Threading;
using Implementation.Interfaces;
using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Tracking.Util;

namespace Implementation.Components
{
    public class DepthImageManager : IDepthImageManager
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        private readonly IFilterManager _filterManager;

        public PointCloud3 PointCloud { get; private set; }

        public VectorField2 VectorField { get; private set; }

        public event EventHandler<PointCloud3> PointcloudFiltered;
        public event EventHandler<VectorField2> VectorfieldChanged;
        public event EventHandler<ImageByteArray> DepthImageChanged;
        public event EventHandler<DepthCameraFrame> RawDepthFrameReceived;

        public int ImageWidth { get; private set; }

        public int ImageHeight { get; private set; }

        private readonly object _rasterSync = new();
        private int _isUpdating;
        private long _sequence;
        internal volatile bool UseObservationSnapshots = true;
        internal long RasterSequence => _sequence;

        // Live readers share the producer gate and keep it until their async analysis finishes.
        internal bool TryReserveRasters() => Interlocked.CompareExchange(ref _isUpdating, 1, 0) == 0;
        internal void ReleaseRasters() => Volatile.Write(ref _isUpdating, 0);
        internal T ReadRasters<T>(Func<T> read)
        {
            lock (_rasterSync) return read();
        }

        // Internal consumers may copy now or reserve the live rasters before reading them later.
        internal event Action<long, double, PointCloud3, VectorField2> SnapshotSourceReady;
        public event EventHandler<TrackingObservation> ObservationReady;

        public DepthImageManager(IFilterManager filterManager)
        {
            _filterManager = filterManager;
        }

        public void Initialize(int sizeX, int sizeY)
        {
            var cloud = new PointCloud3(sizeX, sizeY);
            var vectors = new VectorField2(sizeX, sizeY);
            lock (_rasterSync)
            {
                PointCloud = cloud;
                VectorField = vectors;
                ImageWidth = sizeX;
                ImageHeight = sizeY;
            }
            OnPointcloudFiltered(this, cloud);
            OnVectorfieldChanged(this, vectors);
        }

        public void Update(DepthCameraFrame frame)
        {
            if (!TryReserveRasters()) return;
            var sequence = ++_sequence;
            var timestamp = (double)Stopwatch.GetTimestamp() / Stopwatch.Frequency;
            try
            {
                RawDepthFrameReceived?.Invoke(this, frame);
                PointCloud3 cloud;
                VectorField2 vectors;
                lock (_rasterSync)
                {
                    cloud = PointCloud;
                    vectors = VectorField;
                    _filterManager.FilterAndUpdate(frame.Depth, cloud);
                    vectors.Populate(cloud);
                }
                SnapshotSourceReady?.Invoke(sequence, timestamp, cloud, vectors);
                var handlers = ObservationReady;
                if (UseObservationSnapshots && handlers != null)
                    handlers(this, new TrackingObservation(sequence, timestamp, cloud, vectors));
                OnPointcloudFiltered(this, cloud);
                OnVectorfieldChanged(this, vectors);
            }
            catch (Exception exc)
            {
                Logger.Error(exc);
            }
            finally { ReleaseRasters(); }
        }

        public void Update(ImageByteArray depthImage)
        {
            //@ todo: maybe convert into 8-bit image ?
            DepthImageChanged?.Invoke(this, depthImage);
        }

        protected virtual void OnPointcloudFiltered(object sender, PointCloud3 pointcloud) =>
            PointcloudFiltered?.Invoke(sender, pointcloud);

        protected virtual void OnVectorfieldChanged(object sender, VectorField2 vectorfield) =>
            VectorfieldChanged?.Invoke(sender, vectorfield);

    }
}
