namespace ReFlex.Core.Networking.Util
{
    public struct EmulatorParameters
    {
        public float WidthInMeters { get; set; }
        public float HeightInMeters { get; set; }
        public float PlaneDistanceInMeter { get; set; }
        public float MinDepthInMeter { get; set; }
        public float MaxDepthInMeter { get; set; }
        public int Radius { get; set; }
    }
}