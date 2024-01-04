using ReFlex.Core.Common.Interfaces;
using ReFlex.Core.Common.Util;

namespace Common.Test.Mock;

public class MockPerformanceReporter : IPerformanceReporter
{
    private readonly List<PerformanceDataItem> _performanceData = new List<PerformanceDataItem>();

    public bool MeasurePerformance { get; set; }
    public int FrameId { get; set; }

    public event EventHandler<PerformanceDataItem>? PerformanceDataUpdated;

    public void UpdateFrameId(int frameId)
    {
        FrameId = frameId;
    }

    public void TriggerPerformanceDataUpdatedEvent(PerformanceDataItem data)
    {
        _performanceData.Add(data);
        PerformanceDataUpdated?.Invoke(this, data);
    }

    public List<PerformanceDataItem> GetPerformanceData()
    {
        return _performanceData;
    }

    public bool IsSubscribedToPerformanceDataUpdatedEvent => PerformanceDataUpdated != null;
}