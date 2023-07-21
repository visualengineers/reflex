using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Tracking.Util
{
    /// <summary>
    /// A entity that contains all information of an recorded frame.
    /// </summary>
    public class DepthCameraFrame
    {
        /// <summary>
        /// Gets or sets the depth informations of a frame.
        /// </summary>
        /// <value>
        /// The depth informations.
        /// </value>
        public Point3[] Depth { get; set; }
    }
}
