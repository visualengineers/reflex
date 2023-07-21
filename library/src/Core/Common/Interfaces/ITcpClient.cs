using System.Net.Sockets;
using System.Threading.Tasks;

namespace ReFlex.Core.Common.Interfaces
{
    public interface ITcpClient
    {
        bool Connected { get; }

        Task ConnectAsync(string hostname, int port);

        NetworkStream GetStream();

        void Close();

        void Dispose();
    }
}