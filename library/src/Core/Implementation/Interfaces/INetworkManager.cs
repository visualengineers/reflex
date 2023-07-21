using System.Collections.Generic;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Networking.Util;

namespace Implementation.Interfaces
{
    public interface INetworkManager
    {
        NetworkInterface Type { get; set; }
        
        string ServerAddress { get; }

        string Address { get; set; }
        
        string Endpoint { get; set; }

        int Port { get; set; }
        
        bool IsRunning { get; }

        void Run();

        void Broadcast(ICollection<Interaction> interactions);

        void Stop();
    }
}
