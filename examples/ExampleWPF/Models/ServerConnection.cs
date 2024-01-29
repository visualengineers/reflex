using ReFlex.Core.Networking.Components;
using ReFlex.Core.Networking.Interfaces;

namespace ExampleWPF.Models;

public class ServerConnection
{
    private readonly WebSocketClient _wsClient;
    
    public bool IsConnected { get; private set; }

    public string ServerAddress => _wsClient.Address;

    public IClient ClientInstance => _wsClient;

    public ServerConnection(string address, int port, string endpoint)
    {
        _wsClient = new WebSocketClient(address, port, endpoint);
    }

    public void Connect()
    {
        _wsClient.Connect();
        IsConnected = _wsClient.IsConnected;
    }

    public void Disconnect()
    {
        _wsClient.Disconnect();
        IsConnected = _wsClient.IsConnected;
    }
    
    
}