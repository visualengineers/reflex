using ReFlex.Core.Common.Util;

namespace TrackingServer.Data.Config
{
    public struct ExtremumDescriptionSettings
    {
        public int NumSamples { get; set; }

        public int CheckRadius { get; set; }

        public float FitPercentage { get; set; }

        public ExtremumTypeCheckMethod CheckMethod { get; set; }

        public override string ToString()
        {
            var result = $"=====  {nameof(ExtremumDescriptionSettings)}  ====={Environment.NewLine}";
            result += $" {nameof(CheckMethod)} : {CheckMethod}{Environment.NewLine}";
            result += $" {nameof(NumSamples)} : {NumSamples}{Environment.NewLine}";
            result += $" {nameof(CheckRadius)} : {CheckRadius}{Environment.NewLine}";
            result += $" {nameof(FitPercentage)} : {FitPercentage}{Environment.NewLine}";

            return result;
        }
    }
}
