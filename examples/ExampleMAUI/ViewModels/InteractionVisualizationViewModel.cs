using System.Collections.ObjectModel;
using ExampleMAUI.Models;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Networking.Util;

namespace ExampleMAUI.ViewModels;

public class InteractionVisualizationViewModel: BindableBase, IDisposable
{
    private readonly ServerConnection _server;

    private double _canvasWidth;
    private double _canvasHeight;

    public ObservableCollection<InteractionViewModel> Interactions { get; } = new ObservableCollection<InteractionViewModel>();

    public double CanvasWidth
    {
        get => _canvasWidth;
        set
        {
            _canvasWidth = value;
            RaisePropertyChanged();
        }
    }

    public double CanvasHeight
    {
        get => _canvasHeight;
        set
        {
            _canvasHeight = value;
            RaisePropertyChanged();
        }
    }

    public InteractionVisualizationViewModel()
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
        var interactions = SerializationUtils.DeserializeFromJson<List<Interaction>>(e.Message);
        if (interactions == null)
            return;

        var dispatcher = Application.Current?.Dispatcher;

        dispatcher?.Dispatch(() =>
        {
            Interactions.Clear();
            foreach (var interaction in interactions)
            {
              Interactions.Add(new InteractionViewModel(interaction, _canvasWidth, _canvasHeight));
            }
        });
    }
}
