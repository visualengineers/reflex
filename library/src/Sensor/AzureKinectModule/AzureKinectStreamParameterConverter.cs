using System;
using System.Collections.Generic;
using Microsoft.Azure.Kinect.Sensor;
using ReFlex.Core.Common.Util;

namespace ReFlex.Sensor.AzureKinectModule
{
    public static class AzureKinectStreamParameterConverter
    {
        public static StreamParameter GetStreamParameter(DepthMode depthMode)
        {
            var fps = ConvertFps(GetMaxFps(depthMode));

            switch (depthMode)
            {
                case DepthMode.Off:
                    throw new ArgumentException("Cannot convert disabled depth stream to Stream parameter.");
                case DepthMode.NFOV_2x2Binned:
                    return new StreamParameter(320, 288, fps, DepthImageFormat.Greyccale48bpp);
                case DepthMode.NFOV_Unbinned:
                    return new StreamParameter(640, 576, fps, DepthImageFormat.Greyccale48bpp);
                case DepthMode.WFOV_2x2Binned:
                    return new StreamParameter(512, 512, fps, DepthImageFormat.Greyccale48bpp);
                case DepthMode.WFOV_Unbinned:
                    return new StreamParameter(1024, 1024, fps, DepthImageFormat.Greyccale48bpp);
                case DepthMode.PassiveIR:
                    throw new ArgumentException("Passive IR only is not supported");
                default:
                    throw new ArgumentOutOfRangeException(nameof(depthMode), depthMode, null);
            }
        }

        public static DepthMode GetDepthMode(StreamParameter param)
        {
            if (param.Width == 320)
                return DepthMode.NFOV_2x2Binned;

            if (param.Width == 640)
                return DepthMode.NFOV_Unbinned;

            if (param.Width == 512)
                return DepthMode.WFOV_2x2Binned;
            if (param.Width == 1024)
                return DepthMode.WFOV_Unbinned;

            throw new ArgumentOutOfRangeException("unsupported resolution");
        }

        public static FPS GetFps(StreamParameter param)
        {
            if (param.Framerate == 30)
                return FPS.FPS30;

            if (param.Framerate == 15)
                return FPS.FPS15;

            if (param.Framerate == 5)
                return FPS.FPS5;

            throw new ArgumentException("Unsupported Framerate. Only FPS 30, 15 and 5 are permitted.");
        }

        public static int ConvertFps(FPS fps)
        {
            switch (fps)
            {
                case FPS.FPS5:
                    return 5;
                case FPS.FPS15:
                    return 15;
                case FPS.FPS30:
                    return 30;
                default:
                    throw new ArgumentOutOfRangeException(nameof(fps), fps, null);
            }
        }

        public static FPS GetMaxFps(DepthMode mode)
        {
            switch (mode)
            {
                case DepthMode.Off:
                    return FPS.FPS30;
                case DepthMode.NFOV_2x2Binned:
                case DepthMode.WFOV_2x2Binned:
                case DepthMode.NFOV_Unbinned:
                case DepthMode.PassiveIR:
                    return FPS.FPS30;
                case DepthMode.WFOV_Unbinned:
                    return FPS.FPS15;
                default:
                    throw new ArgumentOutOfRangeException(nameof(mode), mode, null);
            }
        }


        public static IList<StreamParameter> GetSupportedConfigurations()
        {
            return new List<StreamParameter>
            {
                GetStreamParameter(DepthMode.NFOV_2x2Binned),
                GetStreamParameter(DepthMode.NFOV_Unbinned),
                GetStreamParameter(DepthMode.WFOV_2x2Binned),
                GetStreamParameter(DepthMode.WFOV_Unbinned)
            };
        }
    }
}
