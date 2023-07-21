using ReFlex.Core.Networking.Util;

namespace ReFlex.Core.Networking.Interfaces
{
    public interface IServer
    {
        NetworkInterface Type { get; }
        bool IsReady { get; }
        bool IsStarted { get; }


        string Id { get; }
        string Address { get; set; }

        void Start();
        void Stop();
        void Broadcast(object data);
        void Broadcast(byte[] data);
        void Broadcast(string message);
    }
}