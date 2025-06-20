using ReFlex.Core.Common.Components;

namespace ReFlex.Core.Tracking.Util
{
    /// <summary>
    /// A entity that contains all information of a recorded frame.
    /// </summary>
    public class DepthCameraFrame
    {
        /// <summary>
        /// Gets or sets the depth information of a frame.
        /// </summary>
        /// <value>
        /// The depth information.
        /// </value>
        public Point3[] Depth { get; set; }
    }
}
