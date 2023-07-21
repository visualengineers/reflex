using System.Net.Sockets;
using System.Threading.Tasks;
using ReFlex.Core.Common.Interfaces;

namespace ReFlex.Core.Common.Adapter
{
    public class TcpClientAdapter : ITcpClient
    {
        private readonly TcpClient _client;

        public TcpClientAdapter()
        {
            _client = new TcpClient();
        }

        public bool Connected => _client.Connected;
        public async Task ConnectAsync(string hostname, int port)
        {
            await _client.ConnectAsync(hostname, port);
        }

        public NetworkStream GetStream()
        {
            return _client.GetStream();
        }

        public void Close()
        {
            _client.Close();
        }

        public void Dispose()
        {
            _client.Dispose();
        }
    }
}