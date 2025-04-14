using ReFlex.Core.Networking.Util;

namespace TrackingServer.Data.Config
{
    public class NetworkSettings
    {
        public NetworkInterface NetworkInterfaceType { get; set; }

        public float Interval { get; set; }

        public string Address { get; set; }

        public int Port { get; set; }

        public string Endpoint { get; set; }

        public string GetNetworksSettingsString()
        {
            var result = $"=====  {nameof(NetworkSettings)}  ====={Environment.NewLine}";
            result += $"  {nameof(NetworkInterfaceType)}: {Enum.GetName(typeof(NetworkInterface), NetworkInterfaceType)} ({nameof(Interval)}: {Interval}ms){Environment.NewLine}";
            result += $"  {nameof(Address)}: {Address} | ";
            result += $"{nameof(Port)}: {Port} | ";
            result += $"{nameof(Endpoint)}: {Endpoint}{Environment.NewLine}";
            return result;
        }
    }
}