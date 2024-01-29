using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Windows;
using ExampleWPF.Models;
using Prism.Ioc;
using Prism.Mvvm;
using ReFlex.Core.Networking.Util;

namespace ExampleWPF.ViewModels;

public class InteractionListViewModel : BindableBase, IDisposable
{
    private readonly ServerConnection _server;
    private int _messageId = 0;

    public ObservableCollection<InteractionMessage> Messages { get; } = new ObservableCollection<InteractionMessage>();

    public InteractionListViewModel()
    {
        _server = ContainerLocator.Current.Resolve<ServerConnection>();
        _server.ClientInstance.NewDataReceived += UpdateInteractions;
    }
    
    public void Dispose()
    {
        _server.ClientInstance.NewDataReceived -= UpdateInteractions;
        
    }

    private void UpdateInteractions(object? sender, NetworkingDataMessage e)
    {
        _messageId++;

        var dispatcher = Application.Current?.Dispatcher;

        dispatcher?.BeginInvoke(new Action(() =>
        {
            Messages.Add(new InteractionMessage(e.Message, _messageId));

            var count = Messages.Count;

            if (count <= 100)
                return;

            var delete = Messages.SkipLast(100);
            foreach (var msg in delete)
            {
                Messages.Remove(msg);
            }
        }));
    }
}