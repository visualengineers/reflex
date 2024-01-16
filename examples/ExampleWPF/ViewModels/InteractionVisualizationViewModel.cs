using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using ExampleWPF.Models;
using Prism.Ioc;
using Prism.Mvvm;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Networking.Util;

namespace ExampleWPF.ViewModels;

public class InteractionVisualizationViewModel: BindableBase, IDisposable
{
    private readonly ServerConnection _server; 
    
    public ObservableCollection<InteractionViewModel> Interactions = new ObservableCollection<InteractionViewModel>();
    
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
        Console.WriteLine(interactions);
    }
    
    
}