using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Interfaces;

namespace ReFlex.Core.Interactivity.Util;

public class MockRemoteInteractionProcessorService : IRemoteInteractionProcessorService
{
    public bool IsConnected { get; private set; }
    public bool IsBusy { get; }

    public bool SendCompleteDataset { get; set; }
    public async Task<bool> Connect()
    {
        await Task.Run(() => IsConnected = true);
        return IsConnected;
    }

    public async Task<bool> Disconnect()
    {
        await Task.Run(() => IsConnected = false);
        return IsConnected;
    }

    public async Task<Tuple<IList<Interaction>, ProcessPerformance>> Update(PointCloud3 pointCloud, ProcessPerformance measurement, bool measurePerformance)
    {
      var result = new List<Interaction>();

      await Task.Run(() =>
      {
        var rX = new Random().Next(pointCloud.SizeX) / pointCloud.SizeX;
        var rY = new Random().Next(pointCloud.SizeY) / pointCloud.SizeY;

        measurement.Smoothing = TimeSpan.Zero;
        measurement.Preparation = TimeSpan.Zero;
        measurement.Update = TimeSpan.Zero;
        measurement.ComputeExtremumType = TimeSpan.Zero;
        measurement.ConvertDepthValue = TimeSpan.Zero;

        var interaction = new Interaction(new Point3(rX, rY, 0.1f), InteractionType.Push, 20);
        result.Add(interaction);
      });
      
      return new Tuple<IList<Interaction>, ProcessPerformance>(result, measurement);
    }
}
