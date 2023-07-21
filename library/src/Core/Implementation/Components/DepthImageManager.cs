using System;
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

        private bool _isUpdating;

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
            // skip current frame if pointcloud is still being processed...
            if (_isUpdating)
                return;

            _isUpdating = true;

            var depthData = frame.Depth;

            // send raw data
            RawDepthFrameReceived?.Invoke(this, frame);

            _filterManager.FilterAndUpdate(depthData, PointCloud);
            try
            {
                OnPointcloudFiltered(this, PointCloud);
            }
            catch (Exception exc)
            {
                Logger.Error(exc);
            }

            PopulateVectorfield();

            _isUpdating = false;
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

        private void PopulateVectorfield()
        {
            try
            {
                VectorField?.Populate(PointCloud);
                OnVectorfieldChanged(this, VectorField);
            }
            catch (Exception exc)
            {
                Logger.Error(exc);
            }
        }
    }
}