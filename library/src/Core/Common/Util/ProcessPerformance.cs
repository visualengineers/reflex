using System;
using System.Collections.Generic;

namespace ReFlex.Core.Common.Util
{

    public struct ProcessPerformance
    {
        // Optional per-frame remote diagnostics, expressed in milliseconds.
        public Dictionary<string, double> RemoteTimingsMs { get; set; }

        public int RemoteFrameId { get; set; }

        public TimeSpan Preparation { get; set; }

        public TimeSpan Update { get; set; }

        public TimeSpan ConvertDepthValue { get; set; }

        public TimeSpan Smoothing { get; set; }

        public TimeSpan ComputeExtremumType { get; set; }


    }
}
