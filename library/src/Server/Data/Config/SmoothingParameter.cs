using ReFlex.Core.Interactivity.Util;

namespace ReFlex.Server.Data.Config
{
    public struct SmoothingParameter
    {
        public int InteractionHistorySize { get; set; }

        public int NumSmoothingSamples { get; set; }

        public int MaxNumEmptyFramesBetween { get; set; }

        public float TouchMergeDistance2D { get; set; }

        public float DepthScale { get; set; }

        public FilterType Type { get; set; }

        public SmoothingParameter(int historySize = 0, int numSmoothing = 0, float distance2D = 64f, int maxFramesBetween = 3, FilterType type = FilterType.None, float depthScale = 100.0f)
        {
            InteractionHistorySize = historySize;
            NumSmoothingSamples = numSmoothing;
            TouchMergeDistance2D = distance2D;
            MaxNumEmptyFramesBetween = maxFramesBetween;
            Type = type;
            DepthScale = depthScale;
        }

        public string GetSmoothingSettingsString()
        {
            var result = $"=====  {nameof(SmoothingParameter)}  ====={Environment.NewLine}";
            result += $"  {nameof(InteractionHistorySize)}: {InteractionHistorySize} | ";
            result += $"  {nameof(NumSmoothingSamples)}: {NumSmoothingSamples} | ";
            result += $"  {nameof(TouchMergeDistance2D)}: {TouchMergeDistance2D} | ";
            result += $"  {nameof(MaxNumEmptyFramesBetween)}: {MaxNumEmptyFramesBetween} | ";
            result += $"  {nameof(DepthScale)}: {DepthScale} | ";
            result += $"  {nameof(Type)}: {Type}{Environment.NewLine}";
            return result;
        }
    }
}
