using System;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Tracking.Util;

namespace Implementation.Interfaces
{
    public interface IDepthImageManager
    {
        PointCloud3 PointCloud { get; }

        VectorField2 VectorField { get; }

        event EventHandler<PointCloud3> PointcloudFiltered;

        event EventHandler<VectorField2> VectorfieldChanged;

        event EventHandler<ImageByteArray> DepthImageChanged;

        event EventHandler<DepthCameraFrame> RawDepthFrameReceived;

        int ImageWidth { get; }

        int ImageHeight { get; }

        void Initialize(int sizeX, int sizeY);

        void Update(DepthCameraFrame frame);

        void Update(ImageByteArray depthImage);
    }
}