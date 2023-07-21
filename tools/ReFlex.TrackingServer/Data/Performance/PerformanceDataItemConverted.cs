namespace TrackingServer.Data.Performance
{
    public struct PerformanceDataItemConverted
    {
        public int FrameId { get; set; } 
        
        public double LimitationFilter { get; set; }
        public double ValueFilter { get; set; }
        public double ThresholdFilter { get; set; }
        public double BoxFilter { get; set; }
        public double UpdatePointCloud { get; set; }
        
        public double ProcessingPreparation { get; set; }
        
        public double ProcessingUpdate { get; set; }
        
        public double ProcessingConvert { get; set; }
        
        public double ProcessingSmoothing { get; set; }
        
        public double ProcessingExtremum { get; set; }
    }
}