using System;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Events;
using ReFlex.Core.Tracking.Interfaces;

namespace Implementation.Interfaces
{
    public interface ITrackingManager
    {
        IDepthCamera ChosenCamera { get; }

        event EventHandler<TrackingStateChangedEventArgs> TrackingStateChanged;

        /// <summary>
        /// Gets the chosen stream configuration.
        /// </summary>
        /// <value>
        /// The chosen stream configuration.
        /// </value>
        StreamParameter ChosenStreamConfiguration { get; }

        bool TrackingState { get; set; }

        void ChooseCamera(IDepthCamera camera);

        /// <summary>
        /// Chooses the stream-configuration.
        /// </summary>
        /// <param name="configuration">The configuration.</param>
        void ChooseConfiguration(StreamParameter configuration);

        void ToggleTracking();
    }
}