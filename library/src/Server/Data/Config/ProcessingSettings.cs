using ReFlex.Core.Common.Util;

namespace ReFlex.Server.Data.Config
{
    public class ProcessingSettings
    {
        public ObserverType InteractionType { get; set; }

        public int IntervalDuration { get; set; }

        public bool UseObservationSnapshots { get; set; } = true;

        public string GetPorcessingSettingsString()
        {
            var result = $"=====  {nameof(ProcessingSettings)}  ====={Environment.NewLine}";
            result +=
                $"  {nameof(InteractionType)}: {Enum.GetName(typeof(ObserverType), InteractionType)} ({nameof(IntervalDuration)}: {IntervalDuration}ms ){Environment.NewLine}";

            result += $"  {nameof(UseObservationSnapshots)}: {UseObservationSnapshots}{Environment.NewLine}";
            return result;
        }
    }
}