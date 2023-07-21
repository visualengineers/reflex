using System;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Filtering.Components;

namespace Implementation.Interfaces
{
    public interface IFilterManager
    {
        event EventHandler<int> FilterInitialized;
        
        LimitationFilter LimitationFilter { get; }
        
        bool[][] FilterMask { get; }
        
        bool UseOptimizedBoxFilter { get; set; }
        
        LimitationFilterType LimitationFilterType { get; set; }

        ValueFilter ValueFilter { get; }

        ThresholdFilter ThresholdFilter { get; }

        OptimizedBoxFilter BoxFilterOptimized { get; }
        
        BoxFilter BoxFilter { get; }
        
        bool IsLimitationFilterEnabled { get; set; }
        
        bool IsValueFilterEnabled { get; set; }
        
        bool IsThresholdFilterEnabled { get; set; }
        
        bool IsBoxFilterEnabled { get; set; }
        
        float DefaultDistance { get; set; }
        
        bool MeasurePerformance { get; set; }
        
        void FilterAndUpdate(Point3[] depthData, PointCloud3 pointCloud);

        bool UpdateLimitationFilter(float zeroPlane, float threshold, int samples);

        void Init(bool[][] mask, float zeroPlane, float threshold, int samples);
        
        bool Reset();
    }
}