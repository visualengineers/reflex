using BenchmarkDotNet.Attributes;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Networking.Util;
using EmulatedPointCloud = Emulator.Benchmark.Networking.Util.EmulatedPointCloud;

namespace Emulator.Benchmark.Benchmark;

public class EmulatedPointCloudBenchmark
{
    private EmulatedPointCloud _pointCloud;
    
    private Interaction[] _interactions = new Interaction[5]
    {
        new()
        {
            Confidence = 10, Position = new Point3(100f, 200f, -0.5f), Time = DateTime.Now.Ticks, TouchId = 1,
            Type = InteractionType.Push
        },
        new()
        {
            Confidence = 20, Position = new Point3(500f, 200f, -0.25f), Time = DateTime.Now.Ticks, TouchId = 2,
            Type = InteractionType.Push
        },
        new()
        {
            Confidence = 1, Position = new Point3(320f, 240f, -1f), Time = DateTime.Now.Ticks, TouchId = 3,
            Type = InteractionType.Push
        },
        new()
        {
            Confidence = 5, Position = new Point3(100f, 200f, 0.25f), Time = DateTime.Now.Ticks, TouchId = 4,
            Type = InteractionType.Pull
        },
        new()
        {
            Confidence = 30, Position = new Point3(300f, 400f, 0.75f), Time = DateTime.Now.Ticks, TouchId = 5,
            Type = InteractionType.Pull
        }
    };

    public EmulatedPointCloudBenchmark()
    {
        var parameter = new StreamParameter(640, 480, 30);
        
        _pointCloud = new EmulatedPointCloud(new EmulatorParameters
        {
            HeightInMeters = 1.6f,
            WidthInMeters = 2.4f,
            MaxDepthInMeter = 2.1f,
            MinDepthInMeter = 0.8f,
            PlaneDistanceInMeter = 1.45f,
            Radius = (int) (parameter.Width * 0.4)
        });
        
        _pointCloud.InitializePointCloud(parameter);
    }

    [Benchmark]
    public void UpdateInteractionsNoGenerateDepthIMage()
    {
        _pointCloud.GenerateDepthImage = false;
        _pointCloud.UpdateFromInteractions(_interactions.ToList());
    }
    
    [Benchmark]
    public void UpdateInteractionsAndGenerateDepthIMage()
    {
        _pointCloud.GenerateDepthImage = true;
        _pointCloud.UpdateFromInteractions(_interactions.ToList());
    }
    
    // [Benchmark]
    // public void UpdateArray()
    // {
    //     for (var x = 0; x < 640; x++)
    //     for (int y = 0; y < 480; y++)
    //     {
    //         _pointCloud.SetDepthImageValue(127, y * 640 + x);
    //     }
    // }
    //
    // [Benchmark]
    // public void UpdateSpan()
    // {
    //     for (var x = 0; x < 640; x++)
    //     for (int y = 0; y < 480; y++)
    //     {
    //         _pointCloud.SetDepthImageValue(127, y * 640 + x, _pointCloud._image.AsSpan());
    //     }
    // }
    
    [Benchmark]
    public void UpdateInteractions2()
    {
        _pointCloud.GenerateDepthImage = true;
        _pointCloud.UpdateFromInteractions2(_interactions.ToList());
    }
}