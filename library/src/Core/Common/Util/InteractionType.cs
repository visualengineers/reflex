using System;

namespace ReFlex.Core.Common.Util
{
    /// <summary>
    /// The type of an interaction.
    /// </summary>
    /// <remarks>
    /// Define new gestures here.
    /// </remarks>
    [Flags]
    public enum InteractionType
    {
        /// <summary>
        /// No type of interaction.
        /// </summary>
        None = 0,

        /// <summary>
        /// Pushing interaction.
        /// </summary>
        Push = 1,

        /// <summary>
        /// Pulling interaction.
        /// </summary>
        Pull = 2
    }
}
