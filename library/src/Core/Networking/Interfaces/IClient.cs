using System;
using ReFlex.Core.Networking.Util;

namespace ReFlex.Core.Networking.Interfaces
{
    public interface IClient
    {       
        event EventHandler<NetworkingDataMessage> NewDataReceived;

        bool IsInitialized { get; }

        bool IsConnected { get; }

        string Id { get; }
        NetworkInterface Type { get; }
        string Address { get; }
        bool Connect();
        void Disconnect();
        void OnNewDataReceived(object sender, NetworkingDataMessage message);

        void Send(NetworkingDataMessage message);
    }
}