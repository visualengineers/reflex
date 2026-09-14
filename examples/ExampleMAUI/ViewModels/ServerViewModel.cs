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
  public bool ConnectEnabled { get; private set; } = true;

  public int FrameNumber { get; private set; }

  public int NumTouches { get; private set; }
  public ICommand ConnectCommand { get; private set; }
  public ICommand DisconnectCommand { get; private set; }

  public ServerViewModel(ServerConnection connection)
  {
    _server = connection;

    ConnectCommand = new DelegateCommand(Connect, () => IsDisconnected).ObservesCanExecute(() => IsDisconnected);
    DisconnectCommand = new DelegateCommand(Disconnect, () => IsConnected).ObservesCanExecute(() => IsConnected);
  }

  private void Connect()
  {
    ConnectEnabled = false;
    RaisePropertyChanged(nameof(ConnectEnabled));

    _server.Connect();

    RaisePropertyChanged(nameof(IsConnected));
    RaisePropertyChanged(nameof(IsDisconnected));

    var dispatcher = Application.Current?.Dispatcher;

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

    ConnectEnabled = true;
    RaisePropertyChanged(nameof(ConnectEnabled));
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
