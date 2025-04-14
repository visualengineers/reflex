using ReFlex.Core.Common.Util;

namespace TrackingServer.Data.Config
{
    public class ProcessingSettings
    {
        public ObserverType InteractionType { get; set; }

        public int IntervalDuration { get; set; }

        public string GetPorcessingSettingsString()
        {
            var result = $"=====  {nameof(ProcessingSettings)}  ====={Environment.NewLine}";
            result +=
                $"  {nameof(InteractionType)}: {Enum.GetName(typeof(ObserverType), InteractionType)} ({nameof(IntervalDuration)}: {IntervalDuration}ms ){Environment.NewLine}";

            return result;
        }
    }
}