using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;

namespace ReFlex.Server.Data.Config
{
    public struct ExtremumDescriptionSettings
    {
        public int NumSamples { get; set; }

        public int CheckRadius { get; set; }

        private float? _mergeRadius;
        /// <summary>Euclidean sensor-pixel radius; missing legacy values default to three, zero disables consolidation.</summary>
        public float MergeRadius
        {
            get => _mergeRadius ?? ExtremumConsolidator.DefaultRadius;
            set => _mergeRadius = ExtremumConsolidator.ValidateRadius(value);
        }

        public float FitPercentage { get; set; }

        public ExtremumTypeCheckMethod CheckMethod { get; set; }

        public override string ToString()
        {
            var result = $"=====  {nameof(ExtremumDescriptionSettings)}  ====={Environment.NewLine}";
            result += $" {nameof(CheckMethod)} : {CheckMethod}{Environment.NewLine}";
            result += $" {nameof(NumSamples)} : {NumSamples}{Environment.NewLine}";
            result += $" {nameof(CheckRadius)} : {CheckRadius}{Environment.NewLine}";
            result += $" {nameof(MergeRadius)} : {MergeRadius}{Environment.NewLine}";
            result += $" {nameof(FitPercentage)} : {FitPercentage}{Environment.NewLine}";

            return result;
        }
    }
}
