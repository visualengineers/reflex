using System;

namespace ReFlex.Core.Common.Util
{
    public struct FilterPerformance
    {
        public TimeSpan LimitationFilter { get; set; }
        public TimeSpan ValueFilter { get; set; }
        public TimeSpan ThresholdFilter { get; set; }
        public TimeSpan BoxFilter { get; set; }
        public TimeSpan UpdatePointCloud { get; set; }
    }
}