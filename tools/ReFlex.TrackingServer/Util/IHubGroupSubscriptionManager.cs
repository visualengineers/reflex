namespace TrackingServer.Util
{
    public interface IHubGroupSubscriptionManager
    {
        public void Subscribe(string identifier);

        public void Unsubscribe(string identifier);
    }
}
