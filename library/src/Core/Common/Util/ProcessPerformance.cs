using System;

namespace ReFlex.Core.Common.Util
{

    public struct ProcessPerformance
    {
        public TimeSpan Preparation { get; set; }

        public TimeSpan Update { get; set; }

        public TimeSpan ConvertDepthValue { get; set; }

        public TimeSpan Smoothing { get; set; }

        public TimeSpan ComputeExtremumType { get; set; }


    }
}