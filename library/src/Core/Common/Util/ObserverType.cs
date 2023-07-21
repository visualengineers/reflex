using System;

namespace ReFlex.Core.Common.Util
{
    /// <summary>
    /// The type of interaction tracking.
    /// </summary>
    [Flags]
    public enum ObserverType
    {
        /// <summary>
        /// Default value = no observer chosen.
        /// </summary>
        None = 0,

        /// <summary>
        /// The single touch observer
        /// Fast and stable - just one interaction at once.
        /// </summary>
        SingleTouch = 1,

        /// <summary>
        /// The multi touch observer
        /// Slower and not so stable as single touch - but tracks all possible inputs.
        /// </summary>
        MultiTouch = 2,
        
        /// <summary>
        /// The multi touch observer
        /// Slower and not so stable as single touch - but tracks all possible inputs.
        /// </summary>
        Remote = 3
    }
}
