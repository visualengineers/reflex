using ReFlex.Core.Tracking.Interfaces;

namespace ReFlex.Core.Tracking.Util
{
    /// <summary>
    /// The state of a <see cref="IDepthCamera"/>
    /// </summary>
    public enum DepthCameraState
    {
        /// <summary>
        /// The camera is in a error state.
        /// </summary>
        Error = 0,

        /// <summary>
        /// The camera is not connected.
        /// </summary>
        Disconnected = 1,

        /// <summary>
        /// The camera is connected.
        /// </summary>
        Connected = 2,

        /// <summary>
        /// The camera streams its record.
        /// </summary>
        Streaming = 4
    }
}
