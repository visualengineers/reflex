using System;
using System.Collections.Generic;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Tracking.Util;

namespace ReFlex.Core.Tracking.Interfaces
{
    /// <summary>
    /// A camera that is capable of recording depth information.
    /// </summary>
    public interface IDepthCamera
    {
        /// <summary>
        /// Gets the identifier.
        /// </summary>
        /// <value>
        /// The identifier.
        /// </value>
        string Id { get; }

        /// <summary>
        /// Retrieves the Type of Camera to differentiate between different implementations without casting to concrete classes.
        /// </summary>
        CameraType CameraType { get; }

        /// <summary>
        /// Gets the model description.
        /// </summary>
        /// <value>
        /// The model description.
        /// </value>
        string ModelDescription { get; }

        /// <summary>
        /// Gets the <see cref="DepthCameraState"/>.
        /// </summary>
        /// <value>
        /// The camera state.
        /// </value>
        DepthCameraState State { get; }

        /// <summary>
        /// Gets the stream parameters.
        /// </summary>
        /// <value>
        /// The stream parameter.
        /// </value>
        StreamParameter StreamParameter { get; }

        /// <summary>
        /// Occurs when [state changed].
        /// </summary>
        event EventHandler<DepthCameraState> StateChanged;

        /// <summary>
        /// Occurs when a new Depth Frame arrives.
        /// </summary>
        event EventHandler<DepthCameraFrame> FrameReady;

        /// <summary>
        /// Occurs when a new Depth image is captured.
        /// </summary>
        event EventHandler<ImageByteArray> DepthImageReady;

        /// <summary>
        /// Initializes this instance.
        /// </summary>
        void Initialize();

        /// <summary>
        /// Enables one streamtype.
        /// </summary>
        /// <param name="parameter">The parameter.</param>
        void EnableStream(StreamParameter parameter);

        /// <summary>
        /// Gets the possible configurations.
        /// </summary>
        /// <returns>A List of possible configuratiions.</returns>
        IList<StreamParameter> GetPossibleConfigurations();

        /// <summary>
        /// Starts the stream.
        /// </summary>
        void StartStream();

        /// <summary>
        /// Stops the stream.
        /// </summary>
        void StopStream();
    }
}
