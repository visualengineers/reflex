using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Interfaces;

namespace ReFlex.Core.Interactivity.Components;

public class RemoteInteractionProcessor: InteractionObserverBase
{
    private readonly IRemoteInteractionProcessorService _service;

    public RemoteInteractionProcessor(IRemoteInteractionProcessorService service)
    {
        _service = service;
    }

    public override ObserverType Type { get; } = ObserverType.Remote;
    public override PointCloud3 PointCloud { get; set; }
    public override VectorField2 VectorField { get; set; }

    public override event EventHandler<IList<Interaction>> NewInteractions;

    protected override async Task<ProcessingResult> CheckInitialState()
    {
      if (!_service.IsConnected)
      {
        var success = await _service.Connect();
        if (!success)
        {
          return new ProcessingResult(ProcessServiceStatus.Error);
        }
      }

      if (_service.IsBusy)
        return new ProcessingResult();

      var result = new ProcessingResult(ProcessServiceStatus.Available);

      return result;
    }

    protected override async Task<Tuple<IEnumerable<Interaction>, ProcessPerformance>> Analyze(ProcessPerformance performance)
    {
      return await _service.Update(PointCloud, performance, MeasurePerformance);
    }

    /// <summary>
    /// Called when interactions have been processed.
    /// </summary>
    /// <param name="args">The arguments.</param>
    protected override void OnNewInteractions(List<Interaction> args) => NewInteractions?.Invoke(this, args);


}
