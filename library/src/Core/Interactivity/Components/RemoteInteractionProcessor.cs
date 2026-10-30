using System;
using System.Collections.Generic;
using System.Diagnostics;
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

    protected override async Task<Tuple<IEnumerable<Interaction>, ProcessPerformance>> Analyze(ProcessPerformance performance)
    {
        var timer = MeasurePerformance ? Stopwatch.StartNew() : null;
        var result = await _service.Update(PointCloud, Distance, performance, MeasurePerformance);
        if (timer != null && result.Item2.RemoteTimingsMs != null)
            result.Item2.RemoteTimingsMs["client_remote_total"] = timer.Elapsed.TotalMilliseconds;
        return result;
    }

    protected override Task ReportPerformance(ProcessPerformance performance)
    {
        if (performance.RemoteTimingsMs == null) return Task.CompletedTask;
        performance.RemoteTimingsMs["client_depth_conversion"] = performance.ConvertDepthValue.TotalMilliseconds;
        performance.RemoteTimingsMs["client_extremum_classification"] = performance.ComputeExtremumType.TotalMilliseconds;
        performance.RemoteTimingsMs["client_smoothing"] = performance.Smoothing.TotalMilliseconds;
        return _service.ReportPerformance(performance);
    }
}
