using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;

namespace ReFlex.Core.Interactivity.Interfaces;

public interface IRemoteInteractionProcessorService
{
    bool IsConnected { get; }

    bool IsBusy { get; }

    bool SendCompleteDataset { get; set; }

    Task<bool> Connect();

    Task<bool> Disconnect();

    /// <summary>Reads the point cloud for the lifetime of the returned task.</summary>
    /// <remarks>The caller can reuse the input after completion. Copy any data needed later.</remarks>
    Task<Tuple<IEnumerable<Interaction>, ProcessPerformance>> Update(PointCloud3 pointCloud, float zeroPlane, ProcessPerformance measurement,
        bool measurePerformance);

    Task ReportPerformance(ProcessPerformance measurement) => Task.CompletedTask;
}
