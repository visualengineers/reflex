using System.Windows.Input;
using ExampleMAUI.Models;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Networking.Util;

namespace ExampleMAUI.ViewModels;

public class ServerViewModel : BindableBase, IDisposable
{
    private readonly ServerConnection _server;

    public string ServerAddress => _server.ServerAddress;
    public bool IsConnected => _server.IsConnected;
    public bool IsDisconnected => !IsConnected;

    public int FrameNumber{ get; private set; }

    public int NumTouches { get; private set; }
    public ICommand ConnectCommand { get; private set; }
    public ICommand DisconnectCommand { get; private set; }

    public ServerViewModel(IServiceProvider serviceProvider)
    {
        _server = serviceProvider.GetService<ServerConnection>() ?? throw new NullReferenceException($"{nameof(ServerConnection)} not registered with {nameof(serviceProvider)}");

        ConnectCommand = new DelegateCommand(Connect, () => IsDisconnected);
        (ConnectCommand as DelegateCommand)?.ObservesCanExecute(() => IsDisconnected);
        DisconnectCommand = new DelegateCommand(Disconnect, () => IsConnected);
        (DisconnectCommand as DelegateCommand)?.ObservesCanExecute(() => IsConnected);
    }

    private void Connect()
    {
        _server.Connect();
        RaisePropertyChanged(nameof(IsConnected));
        RaisePropertyChanged(nameof(IsDisconnected));

        _server.ClientInstance.NewDataReceived += UpdateServerInfo;
    }

    private void UpdateServerInfo(object? sender, NetworkingDataMessage e)
    {
        FrameNumber++;
        NumTouches = SerializationUtils.DeserializeFromJson<List<Interaction>>(e.Message).Count;
        RaisePropertyChanged(nameof(FrameNumber));
        RaisePropertyChanged(nameof(NumTouches));
    }

    private void Disconnect()
    {
        _server.Disconnect();
        RaisePropertyChanged(nameof(IsConnected));
        RaisePropertyChanged(nameof(IsDisconnected));

        _server.ClientInstance.NewDataReceived -= UpdateServerInfo;

        FrameNumber = 0;
        NumTouches = 0;

        RaisePropertyChanged(nameof(FrameNumber));
        RaisePropertyChanged(nameof(NumTouches));
    }

    public void Dispose()
    {
        Disconnect();
    }
}
