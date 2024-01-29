using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text.Json;
using System.Windows;
using ExampleWPF.Models;
using Prism.Ioc;
using Prism.Mvvm;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Networking.Util;

namespace ExampleWPF.ViewModels;

public class InteractionListViewModel : BindableBase, IDisposable
{
    private readonly ServerConnection _server;
    private int _messageId;
    private const int NumMessages = 100;

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
        var formattedMessage = FormatJson(e.Message);

        dispatcher?.BeginInvoke(new System.Action<int, string>((messageId, message) =>
        {
            Messages.Add(new InteractionMessage(message, messageId));

            var count = Messages.Count;

            if (count <= NumMessages)
                return;

            var delete = Messages.SkipLast(NumMessages);
            foreach (var msg in delete)
            {
                Messages.Remove(msg);
            }
        }), _messageId, formattedMessage);
    }

    private string FormatJson(string jsonMessage)
    {
        var interactions = SerializationUtils.DeserializeFromJson<List<Interaction>>(jsonMessage);
        return JsonSerializer.Serialize(interactions, new JsonSerializerOptions { WriteIndented = true });
    }
}