using System;
using System.Collections.Generic;
using System.Linq;

namespace ReFlex.Core.Calibration.Util
{
    /// <summary>
    /// Represents the result of a calibration process.
    /// The Mapping from the realworld values to the display values.
    /// </summary>
    public struct Calibration
    {
        /// <summary>
        /// Gets or sets the source values.
        /// </summary>
        /// <value>
        /// The source values.
        /// </value>
        public List<int[]> SourceValues { get; set; }

        /// <summary>
        /// Gets or sets the target values.
        /// </summary>
        /// <value>
        /// The target values.
        /// </value>
        public List<int[]> TargetValues { get; set; }

        /// <summary>
        /// Gets or sets the upper threshold.
        /// </summary>
        /// <value>
        /// The upper threshold.
        /// </value>
        public int UpperThreshold { get; set; }

        /// <summary>
        /// Gets or sets the lower threshold.
        /// </summary>
        /// <value>
        /// The lower threshold.
        /// </value>
        public int LowerThreshold { get; set; }

        /// <summary>
        /// Stores the time of the last Update (for update performance / usability reasons
        /// </summary>
        public List<DateTime> LastUpdated { get; set; }

        public string GetCalibrationValuesString()
        {
            var result = $"=====  {nameof(Calibration)}  ====={Environment.NewLine}";
            result += $"  {nameof(LowerThreshold)}: {LowerThreshold} | ";
            result += $"  {nameof(UpperThreshold)}: {UpperThreshold}{Environment.NewLine}";
            
            result += $"  {nameof(SourceValues)}: {Environment.NewLine}";
            
            SourceValues.ForEach(val =>
            {
                result += "    [";
                Array.ForEach(val, current => result += $" {current} |");
                result = result.TrimEnd('|');
                result += $"]{Environment.NewLine}";
            });

            result += $"  {nameof(TargetValues)}: {Environment.NewLine}";
            
            TargetValues.ForEach(val =>
            {
                result += "    [";
                Array.ForEach(val, current => result += $" {current} |");
                result = result.TrimEnd('|');
                result += $"]{Environment.NewLine}";
            });
            
            result += $"  {nameof(LastUpdated)}: [ ";
            
            LastUpdated.ForEach(val =>
            {
                result += $" {val} |";
                result = result.TrimEnd('|');
            });
            
            result += $" ]{Environment.NewLine}";

            return result;
        }
    }
}
