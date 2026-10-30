using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Interfaces;

namespace ReFlex.Core.Interactivity.Components;

public class RemoteInteractionProcessor : InteractionObserverBase
{
    private readonly IRemoteInteractionProcessorService _service;

    public RemoteInteractionProcessor(IRemoteInteractionProcessorService service) => _service = service;

    public override ObserverType Type => ObserverType.Remote;
    public override PointCloud3 PointCloud { get; set; }
    public override VectorField2 VectorField { get; set; }

    protected override async Task<ProcessingResult> CheckInitialState()
    {
        if (PointCloud == null) return new ProcessingResult(ProcessServiceStatus.Error);
        if (_service.IsBusy) return new ProcessingResult(ProcessServiceStatus.Skipped);
        if (!_service.IsConnected && !await _service.Connect())
            return new ProcessingResult(ProcessServiceStatus.Error);
        return new ProcessingResult(_service.IsBusy ? ProcessServiceStatus.Skipped : ProcessServiceStatus.Available);
    }

    protected override Task<Tuple<IEnumerable<Interaction>, ProcessPerformance>> Analyze(ProcessPerformance performance)
        => _service.Update(PointCloud, Distance, performance, MeasurePerformance);
}
