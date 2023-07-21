namespace ReFlex.Core.Tracking.Interfaces
{
    /// <summary>
    /// Creates Instances of <see cref="IDepthCamera"/>.
    /// </summary>
    public interface IDepthCameraFactory
    {
        /// <summary>
        /// Gets the depth camera.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <returns></returns>
        IDepthCamera GetDepthCamera<T>() where T : IDepthCamera;
    }
}
