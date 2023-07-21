namespace TrackingServer.Data.Version
{
    public struct AppVersionInfo
    {
        public string Name { get; }
        public System.Version Version { get; }

        public AppVersionInfo(string name, System.Version version)
        {
            Name = name;
            Version = version;
        }
    }
}