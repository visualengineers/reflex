using TrackingServer.Model;

namespace TrackingServer.Hubs
{
    public class NetworkingHub : StateHubBase<string>
    {
        public static readonly string NetworkingStateGroup = "NetworkingState";

        public NetworkingHub(NetworkingService networkingService)
            : base(networkingService, NetworkingStateGroup)
        {
        }
    }
}