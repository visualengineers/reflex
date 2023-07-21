using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using ReFlex.Core.Common.Interfaces;
using ReFlex.Core.Common.Util;

namespace ReFlex.Core.Common.Components
{

    public class PerformanceAggregator : IPerformanceAggregator, IDisposable
    {
        private const int MaxPerformanceRecords = 10;
        private const int MaxNumIncompleteRecords = 3;


        private int _frameId;

        private readonly List<IPerformanceReporter> _reporters = new List<IPerformanceReporter>();

        private readonly PerformanceData _performanceData = new PerformanceData
        {
            Data = new List<PerformanceDataItem>()
        };

        private bool _measurePerformance;

        public bool MeasurePerformance
        {
            get => _measurePerformance;
            set
            {
                _measurePerformance = value;
                _reporters.ForEach(reporter => reporter.MeasurePerformance = value);
            }
        }

        public event EventHandler<PerformanceData> PerformanceDataUpdated;

        public PerformanceAggregator()
        {
        }

        public PerformanceAggregator(List<IPerformanceReporter> reporters)
        {
            foreach (var performanceReporter in reporters)
            {
                RegisterReporter(performanceReporter);
            }
        }

        public void RegisterReporter(IPerformanceReporter reporter)
        {
            if (reporter == null)
                return;
            _reporters.Add(reporter);
            reporter.PerformanceDataUpdated += AddData;
            SyncFrameId();
            reporter.MeasurePerformance = MeasurePerformance;
        }

        public void UnregisterReporter(IPerformanceReporter reporter)
        {
            if (reporter == null)
                return;
            _reporters.Remove(reporter);
            reporter.PerformanceDataUpdated -= AddData;
        }

        private void AddData(object sender, PerformanceDataItem data)
        {
            var item = CreateNewDataItem();
            lock (_performanceData)
            {
                if (data.Stage == PerformanceDataStage.Start)
                {
                    item.Filter = data.Filter;
                    item.Stage = PerformanceDataStage.FilterDataStored;
                    _performanceData.Data.Add(item);

                    SyncFrameId();
                }
                else if (data.Stage == PerformanceDataStage.ProcessingData)
                {

                    var existing = _performanceData.Data.FirstOrDefault(elem =>
                        elem.Stage == PerformanceDataStage.FilterDataStored && elem.FrameId == data.FrameId);
                    if (existing != null)
                    {
                        item = existing;
                    }

                    item.Process = data.Process;
                    item.Stage = PerformanceDataStage.Complete;
                    _performanceData.Data.Add(item);
                }

                CleanupRecords();

            }

            var completed = _performanceData.Data.Where(elem => elem.Stage == PerformanceDataStage.Complete).ToList();
            PerformanceDataUpdated?.Invoke(this, new PerformanceData
            {
                Data = completed
            });
        }

        private void SyncFrameId()
        {
            _reporters.ForEach(reporter => reporter.UpdateFrameId(_frameId));
        }

        private PerformanceDataItem CreateNewDataItem()
        {
            var result = new PerformanceDataItem
            {
                FrameId = _frameId,
                FrameStart = DateTime.Now.Ticks,
                Stage = PerformanceDataStage.Incomplete
            };
            _frameId++;

            return result;
        }

        private void CleanupRecords()
        {
            if (_performanceData.Data.Count > MaxPerformanceRecords)
                _performanceData.Data.RemoveRange(0, _performanceData.Data.Count - MaxPerformanceRecords);

            var incomplete = _performanceData.Data.Where(elem => elem.Stage != PerformanceDataStage.Complete);
            foreach (var performanceDataItem in incomplete)
            {
                performanceDataItem.Stage = PerformanceDataStage.Complete;
            }
        }

        public void Dispose()
        {
            foreach (var performanceReporter in _reporters)
            {
                UnregisterReporter(performanceReporter);
            }
        }
    }
}