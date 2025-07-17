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

    Task<Tuple<IEnumerable<Interaction>, ProcessPerformance>> Update(PointCloud3 pointCloud, ProcessPerformance measurement,
        bool measurePerformance);
}
