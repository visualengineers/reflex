using System;
using System.Collections.Generic;
using System.Linq;
using ReFlex.Core.Common.Interfaces;
using ReFlex.Core.Common.Util;

namespace ReFlex.Core.Common.Components
{

    public class PerformanceAggregator : IPerformanceAggregator, IDisposable
    {
        /// <summary>
        /// Maximum number of performance records to keep
        /// </summary>
        private const int MaxPerformanceRecords = 10;
        
        [Obsolete]
        private const int MaxNumIncompleteRecords = 3;

        /// <summary>
        /// id of the current frame
        /// </summary>
        private int _frameId;

        /// <summary>
        /// List of performance reporters registered with the aggregator
        /// </summary>
        private readonly List<IPerformanceReporter> _reporters = new List<IPerformanceReporter>();

        /// <summary>
        /// Container for storing performance data
        /// </summary>
        private readonly PerformanceData _performanceData = new PerformanceData
        {
            Data = new List<PerformanceDataItem>()
        };

        /// <summary>
        ///  Flag to determine whether to measure performance or not
        /// </summary>
        private bool _measurePerformance;

        /// <summary>
        /// Flag to determine whether to measure performance or not
        /// Value is propagated to registered reporters, so they start/stop measuring if this value changes
        /// </summary>
        public bool MeasurePerformance
        {
            get => _measurePerformance;
            set
            {
                _measurePerformance = value;
                _reporters.ForEach(reporter => reporter.MeasurePerformance = value);
            }
        }

        /// <summary>
        /// Event triggered when performance data is updated for propagating current performance data
        /// </summary>
        public event EventHandler<PerformanceData> PerformanceDataUpdated;

        /// <summary>
        /// Default constructor
        /// </summary>
        public PerformanceAggregator()
        {
        }

        /// <summary>
        /// Constructor with a list of reporters to register during construction 
        /// </summary>
        /// <param name="reporters">Reporters that are to be registered when constructor is executed</param>
        public PerformanceAggregator(List<IPerformanceReporter> reporters)
        {
            foreach (var performanceReporter in reporters)
            {
                RegisterReporter(performanceReporter);
            }
        }

        /// <summary>
        /// Register a performance reporter with the aggregator.
        /// When registering, the Aggregator subscribes to the <see cref="PerformanceDataUpdated"/> event of the reporter
        /// The frame id is initially synchronized between reporter and aggregator and the <see cref="MeasurePerformance"/> flag is also set to the corresponding value of the aggregator. 
        /// </summary>
        /// <param name="reporter">The Performance Reporter that wil be registered</param>
        public void RegisterReporter(IPerformanceReporter reporter)
        {
            if (reporter == null)
                return;
            _reporters.Add(reporter);
            reporter.PerformanceDataUpdated += AddData;
            SyncFrameId();
            reporter.MeasurePerformance = MeasurePerformance;
        }
        
        /// <summary>
        /// Unregister a performance reporter from the aggregator.
        /// Removes reporter from the internal list and unsubscribes from the <see cref="PerformanceDataUpdated"/> event of the reporter.
        /// </summary>
        /// <param name="reporter">The reporter which is to be removed from the current list of reporters.</param>
        public void UnregisterReporter(IPerformanceReporter reporter)
        {
            if (reporter == null)
                return;
            _reporters.Remove(reporter);
            reporter.PerformanceDataUpdated -= AddData;
        }

        /// <summary>
        /// Event handler to add performance data sent by a reporter.
        /// When data is flagged with <see cref="PerformanceDataStage.Start"/>, the filter data is added and the stage is updated to <see cref="PerformanceDataStage.FilterDataStored"/>.
        /// When associated stage is <see cref="PerformanceDataStage.ProcessingData"/>, processing data is merged with existing filter data (if no filter data exists, a new record is created).
        /// Old records are removed with respect to the specification of <see cref="MaxPerformanceRecords"/>
        /// Records with the stage of <see cref="PerformanceDataStage.Complete"/> are propagated using the <see cref="PerformanceDataUpdated"/> event of the aggregator.
        /// </summary>
        /// <param name="sender">The instance issuing the event</param>
        /// <param name="data">the updated Performance data record</param>
        private void AddData(object sender, PerformanceDataItem data)
        {
            var item = CreateNewDataItem();
            lock (_performanceData)
            {
                var existingProcessData = _performanceData.Data.FirstOrDefault(elem =>
                                        (elem.Stage == PerformanceDataStage.ProcessingData || elem.Stage == PerformanceDataStage.Incomplete) && elem.FrameId == data.FrameId);
                                 
                var existingFilterData = _performanceData.Data.FirstOrDefault(elem =>
                    elem.Stage == PerformanceDataStage.FilterDataStored && elem.FrameId == data.FrameId);
                
                if (data.Stage == PerformanceDataStage.Start)
                {
                    item.Stage = PerformanceDataStage.FilterDataStored;

                    if (existingFilterData != null)
                    {
                        _frameId++;
                        existingFilterData.Stage = PerformanceDataStage.Complete;
                        item.FrameId = _frameId;
                    } 
                    else if (existingProcessData != null)
                    {
                      item = existingProcessData;
                      item.Stage = PerformanceDataStage.Complete;
                      _performanceData.Data.Remove(existingProcessData);
                    }
                    
                    item.Filter = data.Filter;
                    _performanceData.Data.Add(item);
                    
                }
                else if (data.Stage == PerformanceDataStage.ProcessingData)
                {
                    if (existingProcessData != null)
                    {
                        _frameId++;
                        existingProcessData.Stage = PerformanceDataStage.Complete;
                        item.FrameId = _frameId;
                    } 
                    else if (existingFilterData != null)
                    {
                        item = existingFilterData;
                        item.Stage = PerformanceDataStage.Complete;
                        _performanceData.Data.Remove(existingFilterData);

                        _frameId++;
                    }

                    item.Process = data.Process;
                    _performanceData.Data.Add(item);
                }
                
                SyncFrameId();

                CleanupRecords();

            }

            var completed = _performanceData.Data.Where(elem => elem.Stage == PerformanceDataStage.Complete).ToList();
            PerformanceDataUpdated?.Invoke(this, new PerformanceData
            {
                Data = completed
            });
        }

        /// <summary>
        /// Set local frame Id for all registered reporters
        /// </summary>
        private void SyncFrameId()
        {
            _reporters.ForEach(reporter => reporter.UpdateFrameId(_frameId));
        }
        
        /// <summary>
        /// Create a new <see cref="PerformanceDataItem"/>  with the current frame Id, setting the <see cref="PerformanceDataItem.FrameStart"/> to the current time and the <see cref="PerformanceDataItem.Stage"/> to <see cref="PerformanceDataStage.Incomplete"/>
        /// </summary>
        /// <returns>the created <see cref="PerformanceDataItem"/></returns>
        private PerformanceDataItem CreateNewDataItem()
        {
            var result = new PerformanceDataItem
            {
                FrameId = _frameId,
                FrameStart = DateTime.Now.Ticks,
                Stage = PerformanceDataStage.Incomplete
            };

            return result;
        }

        /// <summary>
        /// Remove all records except the first <see cref="MaxNumIncompleteRecords"/> elements.
        /// Set all items with the stage <see cref="PerformanceDataStage.Incomplete"/> to <see cref="PerformanceDataStage.Complete"/> 
        /// </summary>
        private void CleanupRecords()
        {
            if (_performanceData.Data.Count > MaxPerformanceRecords)
                _performanceData.Data.RemoveRange(0, _performanceData.Data.Count - MaxPerformanceRecords);

            // var incomplete = _performanceData.Data.Where(elem => elem.Stage != PerformanceDataStage.Complete);
            // foreach (var performanceDataItem in incomplete)
            // {
            //     performanceDataItem.Stage = PerformanceDataStage.Complete;
            // }
        }

        /// <summary>
        /// Dispose method to unregister reporters during disposal.
        /// </summary>
        public void Dispose()
        {
            foreach (var performanceReporter in _reporters.ToList())
            {
                UnregisterReporter(performanceReporter);
            }
        }
    }
}