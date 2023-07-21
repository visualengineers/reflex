using Prism.Events;
using ReFlex.Core.Tracking.Interfaces;

namespace ReFlex.Core.Events
{
    public class RequestChooseCameraEvent : PubSubEvent<IDepthCamera>
    {
    }
}
