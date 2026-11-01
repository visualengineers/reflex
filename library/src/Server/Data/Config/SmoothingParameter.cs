using ReFlex.Core.Interactivity.Util;

namespace ReFlex.Server.Data.Config
{
    public struct SmoothingParameter
    {
        public int InteractionHistorySize { get; set; }

        public int NumSmoothingSamples { get; set; }

        private double? _contactRetentionSeconds;
        private double? _legacyRetentionSeconds;

        /// <summary>Maximum measurement age in seconds, inclusive. Zero disables retention.</summary>
        public double ContactRetentionSeconds
        {
            get => _contactRetentionSeconds ?? _legacyRetentionSeconds ?? .1;
            set => _contactRetentionSeconds = double.IsFinite(value) && value >= 0 ? value :
                throw new ArgumentOutOfRangeException(nameof(value));
        }

        /// <summary>Deserialization-only migration of legacy configuration, assuming 30 Hz.
        /// Explicit seconds take precedence regardless of JSON property order. Never serialized.</summary>
        public int MaxNumEmptyFramesBetween { set => _legacyRetentionSeconds = Math.Max(0, value) / 30.0; }

        public float TouchMergeDistance2D { get; set; }

        public float DepthScale { get; set; }

        public FilterType Type { get; set; }

        public SmoothingParameter(int historySize = 0, int numSmoothing = 0, float distance2D = 64f, double contactRetentionSeconds = .1, FilterType type = FilterType.None, float depthScale = 100.0f)
        {
            this = default;
            InteractionHistorySize = historySize;
            NumSmoothingSamples = numSmoothing;
            TouchMergeDistance2D = distance2D;
            ContactRetentionSeconds = contactRetentionSeconds;
            Type = type;
            DepthScale = depthScale;
        }

        public string GetSmoothingSettingsString()
        {
            var result = $"=====  {nameof(SmoothingParameter)}  ====={Environment.NewLine}";
            result += $"  {nameof(InteractionHistorySize)}: {InteractionHistorySize} | ";
            result += $"  {nameof(NumSmoothingSamples)}: {NumSmoothingSamples} | ";
            result += $"  {nameof(TouchMergeDistance2D)}: {TouchMergeDistance2D} | ";
            result += $"  {nameof(ContactRetentionSeconds)}: {ContactRetentionSeconds} | ";
            result += $"  {nameof(DepthScale)}: {DepthScale} | ";
            result += $"  {nameof(Type)}: {Type}{Environment.NewLine}";
            return result;
        }
    }
}
