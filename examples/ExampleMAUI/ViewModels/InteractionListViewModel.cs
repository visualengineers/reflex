using System.Collections.ObjectModel;
using System.Text.Json;
using ExampleMAUI.Models;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Networking.Util;

namespace ExampleMAUI.ViewModels;

public class InteractionListViewModel : BindableBase, IDisposable
{
    private readonly ServerConnection _server;
    private int _messageId;
    private const int NumMessages = 100;

    public ObservableCollection<InteractionMessage> Messages { get; } = [];

    public InteractionListViewModel(ServerConnection connection)
    {
        _server = connection;
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

        dispatcher?.Dispatch(() =>
        {
            Messages.Add(new InteractionMessage(formattedMessage, _messageId));

            var count = Messages.Count;

            if (count <= NumMessages)
                return;

            var delete = Messages.SkipLast(NumMessages);
            foreach (var msg in delete)
            {
                Messages.Remove(msg);
            }
        });
    }

    private string FormatJson(string jsonMessage)
    {
        var interactions = SerializationUtils.DeserializeFromJson<List<Interaction>>(jsonMessage);
        return JsonSerializer.Serialize(interactions, new JsonSerializerOptions { WriteIndented = true });
    }
}
