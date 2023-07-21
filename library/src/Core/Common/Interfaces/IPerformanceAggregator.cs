using System;
using ReFlex.Core.Common.Util;

namespace ReFlex.Core.Common.Interfaces
{
    public interface IPerformanceAggregator
    {
        event EventHandler<PerformanceData> PerformanceDataUpdated;
        bool MeasurePerformance { get; set; }

        void RegisterReporter(IPerformanceReporter reporter);

        void UnregisterReporter(IPerformanceReporter reporter);
    }
}