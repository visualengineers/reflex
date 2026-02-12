using ExampleMAUI.Models;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Networking.Util;

namespace ExampleMAUI.ViewModels;

public class InteractionVisualizationViewModel: BindableBase, IDisposable
{
    private readonly ServerConnection _server;

    public List<InteractionViewModel> Interactions { get; private set; } = [];

    public InteractionVisualizationViewModel(ServerConnection connection)
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
        var interactions = SerializationUtils.DeserializeFromJson<List<Interaction>>(e.Message);
        if (interactions == null)
            return;

        var dispatcher = Application.Current?.Dispatcher;

        dispatcher?.Dispatch(() =>
        {
          Interactions = interactions.Select(i => new InteractionViewModel(i)).ToList();
          RaisePropertyChanged(nameof(Interactions));
        });
    }
}
