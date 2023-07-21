using System;
using ReFlex.Core.Common.Util;

namespace ReFlex.Core.Common.Interfaces
{

    public interface IPerformanceReporter
    {
        event EventHandler<PerformanceDataItem> PerformanceDataUpdated;

        bool MeasurePerformance { get; set; }

        void UpdateFrameId(int frameId);
    }
}