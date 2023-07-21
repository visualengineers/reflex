using Prism.Events;
using TrackingServer.Data.Config;

namespace TrackingServer.Events;

/// <summary>
/// event issued by a controller to indicate that <see cref="RemoteProcessingServiceSettings"/> have been updated.
/// Services and ConfigurationManager should subscribe to this.
/// </summary>
public class RemoteProcessingSettingsChangedEvent : PubSubEvent<RemoteProcessingServiceSettings>
{
    
}