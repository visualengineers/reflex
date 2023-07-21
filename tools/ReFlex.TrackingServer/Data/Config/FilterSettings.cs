using System;
using System.Numerics;
using ReFlex.Core.Common.Util;

namespace TrackingServer.Data.Config
{
    public class FilterSettings
    {
        public float Threshold { get; set; }
        public Border BorderValue { get; set; }
        
        public float MinDistanceFromSensor { get; set; }
        
        public LimitationFilterType LimitationFilterType { get; set; }
        
        public bool[][] FilterMask { get; set; }
        
        public bool UseOptimizedBoxFilter { get; set; }
        
        public float AdvancedLimitationFilterThreshold { get; set; }
        
        public int AdvancedLimitationFilterSamples { get; set; }
        
        public bool IsLimitationFilterEnabled { get; set; }
        
        public bool IsValueFilterEnabled { get; set; }
        
        public bool IsThresholdFilterEnabled { get; set; }
        
        public bool IsBoxFilterEnabled { get; set; }
        
        public bool MeasurePerformance { get; set; }
        
        public int BoxFilterRadius { get; set; }
        
        public int BoxFilterNumPasses { get; set; }
        
        public int BoxFilterNumThreads { get; set; }

        public Distance DistanceValue { get; set; }

        public ConfidenceParameter Confidence { get; set; }

        public float MinAngle { get; set; }
        
        public SmoothingParameter SmoothingValues { get; set; }
        
        public ExtremumDescriptionSettings ExtremumSettings { get; set; }

        public string GetFilterSettingsString()
        {
            var result = $"=====  {nameof(FilterSettings)}  ====={Environment.NewLine}";
            result += 
                $"  {nameof(Confidence)} [{nameof(ConfidenceParameter.Min)} | {nameof(ConfidenceParameter.Max)}]: {Confidence.Min} | {Confidence.Max}";
            result += $"{Environment.NewLine}";
            result +=
                $"  {nameof(BorderValue)} [{nameof(Border.Top)} | {nameof(Border.Left)} | {nameof(Border.Bottom)} | {nameof(Border.Right)}]: {BorderValue.Top} | {BorderValue.Left} | {BorderValue.Bottom} | {BorderValue.Right}";
            result += $"{Environment.NewLine}";
            result += $"{nameof(MinDistanceFromSensor)}: {MinDistanceFromSensor}{Environment.NewLine}";
            result += $"{nameof(LimitationFilterType)}: {LimitationFilterType}{Environment.NewLine}";
            result +=
                $"  {nameof(DistanceValue)} [{nameof(Distance.Min)} | {nameof(Distance.Max)} | {nameof(Distance.Default)}]: {DistanceValue.Min} | {DistanceValue.Max} | {DistanceValue.Default}";
            result += $"{Environment.NewLine}";
            result += $"  {nameof(BoxFilterRadius)}: {BoxFilterRadius} | {nameof(BoxFilterNumPasses)}: {BoxFilterNumPasses} | {nameof(BoxFilterNumThreads)}: {BoxFilterNumThreads}";
            result += $"  {nameof(MinAngle)}: {MinAngle} | ";
            result += $"  {nameof(Threshold)}: {Threshold}{Environment.NewLine}";
            result += $"  {nameof(IsLimitationFilterEnabled)}: {IsLimitationFilterEnabled}{Environment.NewLine}";
            result += $"  {nameof(IsValueFilterEnabled)}: {IsValueFilterEnabled}{Environment.NewLine}";
            result += $"  {nameof(IsThresholdFilterEnabled)}: {IsThresholdFilterEnabled}{Environment.NewLine}";
            result += $"  {nameof(IsBoxFilterEnabled)}: {IsBoxFilterEnabled}{Environment.NewLine}";
            result += $"  {nameof(MeasurePerformance)}: {MeasurePerformance}{Environment.NewLine}";
            result += $"  {SmoothingValues.GetSmoothingSettingsString()}";
            result += $"  {ExtremumSettings.ToString()}";

            return result;
        }
    }
}