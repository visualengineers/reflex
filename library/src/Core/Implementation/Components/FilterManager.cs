using System;
using System.Diagnostics;
using Implementation.Interfaces;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Interfaces;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Filtering.Components;

namespace Implementation.Components
{
    public class FilterManager : IFilterManager, IPerformanceReporter
    {
        private readonly LimitationFilter _defaultLimitationFilter;
        private readonly AdvancedLimitationFilter _savedAdvancedLimitationFilter;
        
        private readonly Stopwatch _stopWatch = new();

        private long _frameId = 0;
        
        private static int _initCount = 10;
        private static int _initFrameIdx = _initCount;

        public event EventHandler<PerformanceDataItem> PerformanceDataUpdated;
        public event EventHandler<int> FilterInitialized;
        
        public LimitationFilterType LimitationFilterType { get; set; }

        public LimitationFilter LimitationFilter => LimitationFilterType == LimitationFilterType.LimitationFilter
            ? _defaultLimitationFilter
            : _savedAdvancedLimitationFilter;

        public bool[][] FilterMask
        {
            get => _savedAdvancedLimitationFilter.FilterMask;
            private set => _savedAdvancedLimitationFilter.FilterMask = value;
        }
        
        public bool UseOptimizedBoxFilter { get; set; }

        public ValueFilter ValueFilter { get; }

        public ThresholdFilter ThresholdFilter { get; }

        public OptimizedBoxFilter BoxFilterOptimized { get; }
        public BoxFilter BoxFilter { get; }
        
        public bool IsLimitationFilterEnabled { get; set; }
        public bool IsValueFilterEnabled { get; set; }
        public bool IsThresholdFilterEnabled { get; set; }
        public bool IsBoxFilterEnabled { get; set; }
        
        public float DefaultDistance { get; set; }
        public bool MeasurePerformance { get; set; } = true;
        public void UpdateFrameId(int frameId)
        {
            _frameId = frameId;
        }

        public FilterManager() 
        {
            _defaultLimitationFilter = new LimitationFilter(320, 240);
            _savedAdvancedLimitationFilter = new AdvancedLimitationFilter(320, 240);
            ValueFilter = new ValueFilter(0, 0, 0);
            ThresholdFilter = new ThresholdFilter(0);
            BoxFilter = new BoxFilter(10);
            BoxFilterOptimized = new OptimizedBoxFilter(10);
        }
        
        public void Init(bool[][] mask, float zeroPlane, float threshold, int samples)
        {
            _initCount = samples;
            _initFrameIdx = samples;
            
            _savedAdvancedLimitationFilter.ClearMask(zeroPlane, threshold);
            
            if (mask != null)
            {
                FilterMask = mask;
                FilterInitialized?.Invoke(this, _initCount);
            }
        }

        public bool Reset()
        {
            return _savedAdvancedLimitationFilter.ResetMask();
        }

        public bool UpdateLimitationFilter(float zeroPlane, float threshold, int samples)
        {
            if (LimitationFilterType != LimitationFilterType.AdvancedLimitationFilter)
                return false;

            _initCount = samples;
            _initFrameIdx = 0;
            
            return _savedAdvancedLimitationFilter.ClearMask(zeroPlane, threshold);
        }

        public void FilterAndUpdate(Point3[] depthData, PointCloud3 pointCloud)
        {
            if (_initFrameIdx < _initCount)
            {
                var result = _savedAdvancedLimitationFilter.InitializeMask(pointCloud, _initFrameIdx, _initFrameIdx >= _initCount - 1);
                if (result < 0)
                    _initFrameIdx = _initCount;
                
                _initFrameIdx++;
                
                if (_initFrameIdx == _initCount)
                    FilterInitialized?.Invoke(this, _initFrameIdx);
                return;
            }

            // _frameId++;

            var pData = new PerformanceDataItem
            {
                FrameId = Convert.ToInt32(_frameId),
                FrameStart = DateTime.Now.Ticks
            };

            var filterData = new FilterPerformance();
            
            if (MeasurePerformance) {
                _stopWatch.Start();
            }
            if (IsLimitationFilterEnabled)
                LimitationFilter?.Filter(depthData, pointCloud);

            if (MeasurePerformance)
            {
                _stopWatch.Stop();
                filterData.LimitationFilter = _stopWatch.Elapsed;
                _stopWatch.Reset();
            }

            if (MeasurePerformance) {
                _stopWatch.Start();
            }
            
            if (IsValueFilterEnabled)
                ValueFilter?.Filter(depthData, pointCloud);
            
            if (MeasurePerformance) {
                _stopWatch.Stop();
                filterData.ValueFilter = _stopWatch.Elapsed;
                _stopWatch.Reset();
            }

            if (MeasurePerformance) {
                _stopWatch.Start();
            }
            
            if (IsThresholdFilterEnabled)
                ThresholdFilter?.Filter(depthData, pointCloud);
            
            if (MeasurePerformance) {
                _stopWatch.Stop();
                filterData.ThresholdFilter = _stopWatch.Elapsed;
                _stopWatch.Reset();
            }

            if (MeasurePerformance) {
                _stopWatch.Start();
            }
            
            if (IsBoxFilterEnabled)
                if (UseOptimizedBoxFilter) 
                    BoxFilterOptimized?.Filter(depthData, pointCloud.SizeX, pointCloud.SizeY, pointCloud.Size);
                else
                    BoxFilter?.Filter(depthData, pointCloud);
            
            if (MeasurePerformance) {
                _stopWatch.Stop();
                filterData.BoxFilter = _stopWatch.Elapsed;
                _stopWatch.Reset();
            }
            
            if (MeasurePerformance) {
                _stopWatch.Start();
            }
            
            pointCloud.Update(depthData, DefaultDistance);

            if (MeasurePerformance)
            {
                _stopWatch.Stop();
                filterData.UpdatePointCloud = _stopWatch.Elapsed;
                _stopWatch.Reset();
            }

            if (!MeasurePerformance) 
                return;
            
            pData.Filter = filterData;
            PerformanceDataUpdated?.Invoke(this, pData);
        }
    }
}
