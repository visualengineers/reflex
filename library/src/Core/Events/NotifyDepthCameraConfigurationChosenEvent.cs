using Prism.Events;
using ReFlex.Core.Common.Util;

namespace ReFlex.Core.Events
{
    /// <summary>
    /// Raised when a stream configuration was chosen.
    /// </summary>
    /// <seealso cref="Prism.Events.PubSubEvent{TPayload}" />
    /// <inheritdoc />
    public class NotifyDepthCameraConfigurationChosenEvent : PubSubEvent<StreamParameter>
    {
    }
}
