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

    /// <summary>Classify absolute sensor depth before normalisation; do not trust remote type labels.</summary>
    protected static List<Interaction> ClassifyCandidates(IEnumerable<Interaction> candidates, float zeroPlane, float deadZone)
    {
        var result = new List<Interaction>();
        foreach (var candidate in candidates)
        {
            var z = candidate.Position.Z;
            if (!float.IsFinite(z) || System.Math.Abs(z - zeroPlane) <= deadZone) continue;
            candidate.Type = z < zeroPlane ? InteractionType.Push : InteractionType.Pull;
            result.Add(candidate);
        }
        return result;
    }

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

        var zeroPlane = Distance;
        var deadZone = MinDistance;
        var processed = await _service.Update(PointCloud, zeroPlane, result.PerformanceMeasurement, MeasurePerformance);

        var candidates = processed.Item1;
        var perfItem = new ProcessPerformance { Preparation = processed.Item2.Preparation, Update = processed.Item2.Update };
        var start = DateTime.Now.Ticks;
        if (MeasurePerformance)
        {
            _stopWatch.Start();
        }

        var interactions = ConvertDepthValue(ClassifyCandidates(candidates, zeroPlane, deadZone));

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
