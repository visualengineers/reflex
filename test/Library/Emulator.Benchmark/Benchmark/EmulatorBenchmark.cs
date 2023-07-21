using BenchmarkDotNet.Attributes;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Networking.Event;
using ReFlex.Sensor.EmulatorModule;

namespace Emulator.Benchmark.Benchmark;

public class EmulatorBenchmark
{
    private readonly EmulatorCamera _camera = new();
    private readonly StreamParameter _params = new(640, 480, 30);

    private Interaction[] _interactions = new Interaction[5]
    {
        new()
        {
            Confidence = 10, Position = new Point3(0.2f, 0.3f, -0.5f), Time = DateTime.Now.Ticks, TouchId = 1,
            Type = InteractionType.Push
        },
        new()
        {
            Confidence = 20, Position = new Point3(0.8f, 0.3f, -0.25f), Time = DateTime.Now.Ticks, TouchId = 2,
            Type = InteractionType.Push
        },
        new()
        {
            Confidence = 1, Position = new Point3(0.5f, 0.5f, -1f), Time = DateTime.Now.Ticks, TouchId = 3,
            Type = InteractionType.Push
        },
        new()
        {
            Confidence = 5, Position = new Point3(0.2f, 0.4f, 0.25f), Time = DateTime.Now.Ticks, TouchId = 4,
            Type = InteractionType.Pull
        },
        new()
        {
            Confidence = 30, Position = new Point3(0.5f, 0.7f, 0.75f), Time = DateTime.Now.Ticks, TouchId = 5,
            Type = InteractionType.Pull
        }
    };

    private readonly InteractionsReceivedEventArgs _args1;
    private readonly InteractionsReceivedEventArgs _args0;
    private readonly InteractionsReceivedEventArgs _args2;
    private readonly InteractionsReceivedEventArgs _args4;
    private readonly InteractionsReceivedEventArgs _args3;
    private readonly InteractionsReceivedEventArgs _args5;

    public EmulatorBenchmark()
    {
        _camera.EnableStream(_params);
        _camera.StartStream();
        
        _args0 = new InteractionsReceivedEventArgs(this, "");
        
        var json1 = SerializationUtils.SerializeToJson(_interactions.ToList().Take(1));
        _args1 = new InteractionsReceivedEventArgs(this, json1);
        
        var json2 = SerializationUtils.SerializeToJson(_interactions.ToList().Take(2));
        _args2 = new InteractionsReceivedEventArgs(this, json2);

        
        var json3 = SerializationUtils.SerializeToJson(_interactions.ToList().Take(3));
        _args3 = new InteractionsReceivedEventArgs(this, json3);

        
        var json4 = SerializationUtils.SerializeToJson(_interactions.ToList().Take(4));
        _args4 = new InteractionsReceivedEventArgs(this, json4);

        
        var json5 = SerializationUtils.SerializeToJson(_interactions.ToList());
        _args5 = new InteractionsReceivedEventArgs(this, json5);


    }
    
    [Benchmark]
    public void UpdateWithoutInteraction()
    {
        _camera.InteractionsReceivedFromEmulatorInstance(this, _args0);
    }

    [Benchmark]
    public void UpdateWithSingleInteraction()
    {
        _camera.InteractionsReceivedFromEmulatorInstance(this, _args1);
    }
    
    [Benchmark]
    public void UpdateWithTwoInteractions()
    {
        _camera.InteractionsReceivedFromEmulatorInstance(this, _args2);
    }
    
    [Benchmark]
    public void UpdateWithThreeInteractions()
    {
        _camera.InteractionsReceivedFromEmulatorInstance(this, _args3);
    }
    
    [Benchmark]
    public void UpdateWithFourInteractions()
    {
        _camera.InteractionsReceivedFromEmulatorInstance(this, _args4);
    }
    
    [Benchmark]
    public void UpdateWithFiveInteractions()
    {
        _camera.InteractionsReceivedFromEmulatorInstance(this, _args5);
    }
}