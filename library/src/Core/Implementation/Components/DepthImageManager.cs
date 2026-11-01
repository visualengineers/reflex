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

        private int _isUpdating;
        private long _sequence;
        public event EventHandler<TrackingObservation> ObservationReady;

        public DepthImageManager(IFilterManager filterManager)
        {
            _filterManager = filterManager;
        }

        public void Initialize(int sizeX, int sizeY)
        {
            PointCloud = new PointCloud3(sizeX, sizeY);
            OnPointcloudFiltered(this, PointCloud);

            VectorField = new VectorField2(sizeX, sizeY);
            OnVectorfieldChanged(this, VectorField);

            ImageWidth = sizeX;
            ImageHeight = sizeY;
        }

        public void Update(DepthCameraFrame frame)
        {
            if (Interlocked.CompareExchange(ref _isUpdating, 1, 0) != 0) return;
            var timestamp = (double)Stopwatch.GetTimestamp() / Stopwatch.Frequency;
            try
            {
                RawDepthFrameReceived?.Invoke(this, frame);
                _filterManager.FilterAndUpdate(frame.Depth, PointCloud);
                VectorField.Populate(PointCloud);
                // Build the pair before publishing either legacy raster event. The next sensor
                // frame cannot mutate these owned copies while remote analysis is awaiting a reply.
                var observation = new TrackingObservation(++_sequence, timestamp, PointCloud, VectorField);
                ObservationReady?.Invoke(this, observation);
                OnPointcloudFiltered(this, PointCloud);
                OnVectorfieldChanged(this, VectorField);
            }
            catch (Exception exc)
            {
                Logger.Error(exc);
            }
            finally { Volatile.Write(ref _isUpdating, 0); }
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
