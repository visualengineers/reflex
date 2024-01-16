using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Windows;
using ExampleWPF.Models;
using Prism.Ioc;
using Prism.Mvvm;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Networking.Util;

namespace ExampleWPF.ViewModels;

public class InteractionVisualizationViewModel: BindableBase, IDisposable
{
    private readonly ServerConnection _server;
    private readonly ObservableCollection<InteractionViewModel> _interactions = new ObservableCollection<InteractionViewModel>();

    public ObservableCollection<InteractionViewModel> Interactions => _interactions; 
    
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

        dispatcher?.BeginInvoke(new Action(() =>
        {
            _interactions.Clear();
            _interactions.AddRange(interactions.Select(i => new InteractionViewModel(i)));
        }));
    } 
}