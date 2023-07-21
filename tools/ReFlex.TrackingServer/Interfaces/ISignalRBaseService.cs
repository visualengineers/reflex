using TrackingServer.Util;

namespace TrackingServer.Interfaces
{
    public interface ISignalRBaseService<T>
    {
        IHubGroupSubscriptionManager StateSubscriptionManager { get; }
        
        T GetState();
    }
}