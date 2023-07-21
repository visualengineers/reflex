using System;
using Implementation.Interfaces;
using NLog;
using Prism.Events;
using ReFlex.Core.Common.Interfaces;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Events;
using TrackingServer.Data.Config;
using TrackingServer.Events;

namespace TrackingServer.Model;

public class SettingsService
{
    private readonly ConfigurationManager _configManager;
    private readonly IFilterManager _filterManager;
    private readonly IInteractionManager _interactionManager;
    private readonly IPerformanceAggregator _performanceAggregator;
    private readonly IEventAggregator _eventAggregator;
        
    private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
    
    public SettingsService(ConfigurationManager configManager, 
        IFilterManager filterManager, 
        IInteractionManager interactionManager,
        IPerformanceAggregator performanceAggregator, 
        IEventAggregator eventAggregator)
    {
        _configManager = configManager;
        _filterManager = filterManager;
        _interactionManager = interactionManager;
        _performanceAggregator = performanceAggregator;
        _eventAggregator = eventAggregator;

        _eventAggregator.GetEvent<RequestConfigurationUpdateEvent>().Subscribe(UpdateFromConfiguration);
        _eventAggregator.GetEvent<RequestRestoreFilterMaskEvent>().Subscribe(RestoreFilterFromConfig);
    }

    public void Init()
    {
        UpdateFromConfiguration(_configManager?.Settings?.IsAutoStartEnabled ?? false);
        RestoreFilterFromConfig();
    }

    private void RestoreFilterFromConfig()
    {
        var settings = _configManager?.Settings?.FilterSettingValues;

        var savedMask = settings?.FilterMask;
        if (savedMask != null && _filterManager != null)
        {
            var zeroPlane = _configManager?.Settings?.FilterSettingValues?.DistanceValue.Default ?? 0;
            var threshold = _configManager?.Settings?.FilterSettingValues?.AdvancedLimitationFilterThreshold ?? 0.01f;
            var samples = _configManager?.Settings?.FilterSettingValues?.AdvancedLimitationFilterSamples ?? 10;

            // set Zero Plane and Threshold for Limitation Filter
            _filterManager.UpdateLimitationFilter(zeroPlane, threshold, samples);

            _filterManager.Init(savedMask, zeroPlane, threshold, samples);
            
            _filterManager.FilterInitialized += SaveFilterMask;
        }
    }
    
    private void SaveFilterMask(object sender, int e)
    {
        var mask = _filterManager.FilterMask;
        if (mask != null)
        {
            _configManager.Settings.FilterSettingValues.FilterMask = new bool[mask.Length][];
            Array.Copy(mask, _configManager.Settings.FilterSettingValues.FilterMask, mask.Length);
        }
    }

    private void UpdateFromConfiguration(bool restartServices)
    {
        if (_configManager?.Settings?.FilterSettingValues == null) 
            return;
        
        if (_filterManager != null)
        {
            _filterManager.DefaultDistance = _configManager.Settings.FilterSettingValues?.DistanceValue.Default ?? 0f;
            _filterManager.LimitationFilterType = _configManager.Settings.FilterSettingValues?.LimitationFilterType ?? LimitationFilterType.LimitationFilter;

            _filterManager.IsThresholdFilterEnabled =
                _configManager.Settings.FilterSettingValues?.IsThresholdFilterEnabled ?? false;
            _filterManager.IsLimitationFilterEnabled =
                _configManager.Settings.FilterSettingValues?.IsLimitationFilterEnabled ?? false;
            _filterManager.IsValueFilterEnabled =
                _configManager.Settings.FilterSettingValues?.IsValueFilterEnabled ?? false;
            _filterManager.IsBoxFilterEnabled =
                _configManager.Settings.FilterSettingValues?.IsBoxFilterEnabled ?? false;
            _performanceAggregator.MeasurePerformance =
                _configManager.Settings.FilterSettingValues?.MeasurePerformance ?? false;
        }
        
        if (_filterManager?.LimitationFilter != null)
        {
            var border = _configManager.Settings.FilterSettingValues?.BorderValue ?? new Border();
            _filterManager.LimitationFilter.LeftBound = border.Left;
            _filterManager.LimitationFilter.RightBound = border.Right;
            _filterManager.LimitationFilter.UpperBound = border.Top;
            _filterManager.LimitationFilter.LowerBound = border.Bottom;

            _filterManager.LimitationFilter.MinDistanceFromSensor =
                _configManager.Settings.FilterSettingValues?.MinDistanceFromSensor ?? 0;
        }
        
        if (_filterManager?.ThresholdFilter != null)
            _filterManager.ThresholdFilter.Threshold = _configManager.Settings.FilterSettingValues?.Threshold ?? 0;

        if (_filterManager?.BoxFilter != null)
        {
            _filterManager.BoxFilterOptimized.NumThreads = _configManager.Settings.FilterSettingValues.BoxFilterNumThreads;
            _filterManager.BoxFilterOptimized.NumPasses = _configManager.Settings.FilterSettingValues.BoxFilterNumPasses;
            _filterManager.BoxFilter.Radius = _configManager.Settings.FilterSettingValues.BoxFilterRadius;
            _filterManager.BoxFilterOptimized.Radius = _configManager.Settings.FilterSettingValues.BoxFilterRadius;
            _filterManager.UseOptimizedBoxFilter = _configManager.Settings.FilterSettingValues.UseOptimizedBoxFilter;
        }

        if (_interactionManager == null) 
            return;

        var distance = _configManager.Settings.FilterSettingValues.DistanceValue;
        _interactionManager.Distance = distance.Default;
        if (_filterManager?.BoxFilter != null)
            _filterManager.BoxFilter.DefaultValue = distance.Default;
                
        _interactionManager.MinDistance = distance.Min;
        _interactionManager.MaxDistance = distance.Max;
        _interactionManager.InputDistance = distance.InputDistance;
                
        _interactionManager.MinAngle = _configManager.Settings.FilterSettingValues.MinAngle;
                
        var confidence = _configManager.Settings.FilterSettingValues.Confidence;
        _interactionManager.MinConfidence = confidence.Min;
        _interactionManager.MaxConfidence = confidence.Max;

        var smooth = _configManager.Settings.FilterSettingValues.SmoothingValues;
        _interactionManager.InteractionHistorySize = smooth.InteractionHistorySize;
        _interactionManager.NumSmoothingFrames = smooth.NumSmoothingSamples;
        _interactionManager.TouchMergeDistance2D = smooth.TouchMergeDistance2D;
        _interactionManager.DepthScale = smooth.DepthScale;
        _interactionManager.MaxNumEmptyFramesBetween = smooth.MaxNumEmptyFramesBetween;
        _interactionManager.FilterType = smooth.Type;

        var extremums = _configManager.Settings.FilterSettingValues.ExtremumSettings;
        _interactionManager.ExtremumTypeCheckNumSamples = extremums.NumSamples;
        _interactionManager.ExtremumTypeCheckRadius = extremums.CheckRadius;
        _interactionManager.ExtremumTypeCheckMethod = extremums.CheckMethod;
        _interactionManager.ExtremumTypeCheckFittingPercentage = extremums.FitPercentage;
        
        _eventAggregator.GetEvent<ServerSettingsUpdatedEvent>().Publish(_configManager.Settings);
        
        if (restartServices)
            _eventAggregator.GetEvent<RequestServiceRestart>().Publish();
    }
}