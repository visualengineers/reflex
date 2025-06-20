using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Interfaces;

namespace ReFlex.Core.Interactivity.Components;

public class RemoteInteractionProcessor: InteractionObserverBase
{
    private readonly IRemoteInteractionProcessorService _service;
    private readonly Stopwatch _stopWatch = new();

    public RemoteInteractionProcessor(IRemoteInteractionProcessorService service)
    {
        _service = service;
    }

    public override ObserverType Type { get; } = ObserverType.Remote;
    public override PointCloud3 PointCloud { get; set; }
    public override VectorField2 VectorField { get; set; }

    public override event EventHandler<IList<Interaction>> NewInteractions;

    public override async Task<ProcessingResult> Update()
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

        var processed = await _service.Update(PointCloud, result.PerformanceMeasurement, MeasurePerformance);

        var candidates = processed.Item1;
        var perfItem = new ProcessPerformance { Preparation = processed.Item2.Preparation, Update = processed.Item2.Update };
        var start = DateTime.Now.Ticks;
        if (MeasurePerformance)
        {
            _stopWatch.Start();
        }

        var interactions = ConvertDepthValue(candidates.ToList());

        if (MeasurePerformance)
        {
            _stopWatch.Stop();
            perfItem.ConvertDepthValue = _stopWatch.Elapsed;
            _stopWatch.Reset();
        }

        if (MeasurePerformance)
        {
            _stopWatch.Start();
        }
        var frame = ComputeSmoothingValue(interactions);
        if (MeasurePerformance)
        {
            _stopWatch.Stop();
            perfItem.Smoothing = _stopWatch.Elapsed;
            _stopWatch.Reset();
        }

        if (MeasurePerformance)
        {
            _stopWatch.Start();
        }
        var processedInteractions = ComputeExtremumType(frame.Interactions, PointCloud.AsJaggedArray());
        if (MeasurePerformance)
        {
            _stopWatch.Stop();
            perfItem.ComputeExtremumType = _stopWatch.Elapsed;
            _stopWatch.Reset();
        }

        UpdatePerformanceMetrics(perfItem, start);

        NewInteractions?.Invoke(this, processedInteractions);

        return result;
    }
}
