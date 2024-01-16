using System.Windows.Input;
using ExampleWPF.Models;
using Prism.Commands;
using Prism.Ioc;
using Prism.Mvvm;

namespace ExampleWPF.ViewModels;

public class ServerViewModel : BindableBase
{
    private readonly ServerConnection _server;


    public string ServerAddress => _server.ServerAddress;
    public bool IsConnected => _server.IsConnected;
    public bool IsDisconnected => !IsConnected;
    public ICommand ConnectCommand { get; private set; }
    public ICommand DisconnectCommand { get; private set; }
    
    public ServerViewModel()
    {
        _server = ContainerLocator.Current.Resolve<ServerConnection>();

        ConnectCommand = new DelegateCommand(Connect, () => IsDisconnected);
        (ConnectCommand as DelegateCommand).ObservesCanExecute(() => IsDisconnected);
        DisconnectCommand = new DelegateCommand(Disconnect, () => IsConnected);
        (DisconnectCommand as DelegateCommand).ObservesCanExecute(() => IsConnected);
    }

    private void Connect()
    {
        _server.Connect();
        RaisePropertyChanged(nameof(IsConnected));
        RaisePropertyChanged(nameof(IsDisconnected));
    }

    private void Disconnect()
    {
        _server.Disconnect();
        RaisePropertyChanged(nameof(IsConnected));
        RaisePropertyChanged(nameof(IsDisconnected));
    }
}