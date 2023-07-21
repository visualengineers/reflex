using System;

namespace ReFlex.Core.Common.Util
{

    public class ProcessingResult
    {
        public ProcessServiceStatus ServiceStatus { get; }

        public ProcessPerformance PerformanceMeasurement { get; set; } = new ProcessPerformance
        {
            Update = TimeSpan.Zero,
            ComputeExtremumType = TimeSpan.Zero,
            Preparation = TimeSpan.Zero,
            Smoothing = TimeSpan.Zero,
            ConvertDepthValue = TimeSpan.Zero
        };

        public ProcessingResult(ProcessServiceStatus status = ProcessServiceStatus.Skipped)
        {
            ServiceStatus = status;
        }
    }
}