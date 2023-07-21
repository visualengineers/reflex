using System;
using ReFlex.Core.Tracking.Interfaces;

namespace ReFlex.Core.Events
{
    public class TrackingStateChangedEventArgs : EventArgs
    {
        public IDepthCamera Camera { get; }

        public bool TrackingState { get; }

        public TrackingStateChangedEventArgs(IDepthCamera camera, bool trackingState)
        {
            Camera = camera;
            TrackingState = trackingState;
        }
    }
}
