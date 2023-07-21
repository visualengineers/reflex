using System;

namespace ReFlex.Core.Common.Util
{
    public class PerformanceDataItem
    {
        public int FrameId { get; set; }
        public long FrameStart { get; set; }
        public FilterPerformance Filter { get; set; }
        
        public ProcessPerformance Process { get; set; }

        public PerformanceDataStage Stage { get; set; }
    }
}