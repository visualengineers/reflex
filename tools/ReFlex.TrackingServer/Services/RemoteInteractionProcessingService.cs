using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Grpc.Net.Client;
using Implementation.Interfaces;
using NLog;
using Prism.Events;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Events;
using ReFlex.Core.Interactivity.Interfaces;
using ReFlex.gRpc;
using ServiceStack;
using TrackingServer.Data.Config;
using TrackingServer.Events;
using TrackingServer.Model;
using static System.Enum;
using ConfigurationManager = TrackingServer.Model.ConfigurationManager;
using Interaction = ReFlex.Core.Common.Components.Interaction;
using Math = System.Math;

namespace TrackingServer.Services;

public class RemoteInteractionProcessingService : IRemoteInteractionProcessorService, IDisposable
{
    private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
    private readonly Stopwatch _stopWatch = new();
    
    private InteractionProcessing.InteractionProcessingClient _client;
    private GrpcChannel _channel;
    private readonly ConfigurationManager _configMgr;
    private RemoteProcessingServiceSettings _config  = new();
    private readonly IEventAggregator _eventAggregator;

    public bool IsConnected { get; private set; }

    public bool IsBusy { get; private set; }

    public bool SendCompleteDataset
    {
        get => _config.CompleteDataSet;
        set => _config.CompleteDataSet = value;
    }

    public RemoteInteractionProcessingService(ConfigurationManager configManager, IEventAggregator eventAggregator)
    {
        _configMgr = configManager;
        _eventAggregator = eventAggregator;
        eventAggregator.GetEvent<RequestSaveSettingsEvent>()?.Subscribe(SaveSettings);
        eventAggregator.GetEvent<RequestLoadSettingsEvent>()?.Subscribe(LoadSettings);
        eventAggregator.GetEvent<RemoteProcessingSettingsChangedEvent>()?.Subscribe(OnSettingsChanged);
    }

    public async void Dispose()
    {
        await Disconnect();
        
        _eventAggregator.GetEvent<RequestSaveSettingsEvent>()?.Unsubscribe(SaveSettings);
        _eventAggregator.GetEvent<RequestLoadSettingsEvent>()?.Unsubscribe(LoadSettings);
        _eventAggregator.GetEvent<RemoteProcessingSettingsChangedEvent>()?.Unsubscribe(OnSettingsChanged);
    }


    public async Task<bool> Connect()
    {
        if (IsBusy)
        {
            return false;
        }
        
        try
        {
            IsBusy = true;
            
            // The port number must match the port of the gRPC server.
            _channel = GrpcChannel.ForAddress(_config.Address);
            _client = new InteractionProcessing.InteractionProcessingClient(_channel);
            var status = await _client.GetStateAsync(new StateRequest());
            IsConnected = status.IsReady;
            IsBusy = false;
        }
        catch (Exception exc)
        {
            Logger.Error(exc, $"Error when connecting to {_config.Address} in {GetType()}.{nameof(Connect)}().");
            IsBusy = true;
            IsConnected = false;
            ResetState();
        }
        
        return IsConnected;
    }


    public async Task<bool> Disconnect()
    {
        try
        {
            if (_client != null && IsConnected)
            {
                var status = await _client.GetStateAsync(new StateRequest());
                Logger.Info($"Disconnect from {_config.Address} after frame {status.FrameId}");
            }
        }
        catch (Exception exc)
        {
            Logger.Error(exc, $"Error when disconnecting from {_config.Address} in {GetType()}.{nameof(Disconnect)}().");
        }
        finally
        {
            IsConnected = false;
            IsBusy = false;
            _client = null;
            _channel?.Dispose();
        }
        
        return IsConnected;
    }

    public async Task<Tuple<IList<Interaction>, ProcessPerformance>> Update(PointCloud3 pointCloud, ProcessPerformance performance, bool doMeasure)
    {
        var result = new List<Interaction>();

        if (IsBusy)
        {
            Logger.Warn("Processor is busy: skipping request.");
            return new Tuple<IList<Interaction>, ProcessPerformance>(result, performance);
        }
        
        IsBusy = true;

        try
        {
            if (doMeasure)
            {
                _stopWatch.Start();
            }

            var points = pointCloud.AsArray();

            var values = new DepthValues1d();

            var mapping = SendCompleteDataset ? ExtractDepthValues(points, ref values) : ExtractDepthValuesForCleanedUpDataset(points, ref values);


            if (doMeasure)
            {
                _stopWatch.Stop();
                performance.Preparation = _stopWatch.Elapsed;
                _stopWatch.Reset();
            }
        
            if (doMeasure)
            {
                _stopWatch.Start();
            }

            var reply = await _client.ComputeInteractionsAsync(values);
            
            if (doMeasure)
            {
                _stopWatch.Stop();
                performance.Update = _stopWatch.Elapsed;
                _stopWatch.Reset();
            }

            Logger.Info($"Received Interactions from gRPC client on address: {_config.Address}");

            result = reply.Interactions.ToList().ConvertAll(i => ConvertInteraction(points, i, mapping));
            
            Logger.Info($"Interactions: {result}");
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            IsConnected = false;
        }
        finally
        {
            IsBusy = false;
        }
        
        return new Tuple<IList<Interaction>, ProcessPerformance>(result, performance);
    }

    public async void StartService()
    {
        await Disconnect();
        await Connect();
    }

    // public void Save(PointCloud3 pCloud)
    // {
    //     if (reply.Interactions.Count > 0 && !DataSaved)
    //     {
    //         var response = await _client.SaveDataAsync(new SaveRequest
    //         {
    //             Filename = $"data_{reply.FrameId}",
    //             Points = request
    //         });
    //
    //         DataSaved = response.Success;
    //         _logger.Info($"Data Saved: {response.File}");
    //     }
    // }

    private int[] ExtractDepthValues(Point3[] points, ref DepthValues1d depthValues)
    {
        depthValues.Z.AddRange(points.Select(p => p.Z));
        return Array.Empty<int>();
    }

    private int[] ExtractDepthValuesForCleanedUpDataset(Point3[] points, ref DepthValues1d depthValues)
    {
        var values = new int[points.Length];
        var cleanedIdx = 0;
        for (var i = 0; i < points.Length; i++)
        {
            var p = points[i];
            if (p.IsFiltered || !p.IsValid) 
                continue;
            
            values[cleanedIdx] = i;
            depthValues.Z.Add(p.Z);
            cleanedIdx++;
        }

        return values;
    }

    private PointCloud3d ConvertPointCloud(Point3[][] data)
    {
        var result = new PointCloud3d();
            
        for (var x_i = 0; x_i < data.Length; x_i++)
        {
            for (var y_i = 0; y_i < data[x_i].Length; y_i++)
            {
                var p3 = data[x_i][y_i];
                if (!SendCompleteDataset && (p3.IsFiltered || !p3.IsValid))
                    continue;

                var p3d = new Point3d
                {
                    IsFiltered = p3.IsFiltered,
                    IsValid = p3.IsFiltered,
                    X = p3.X,
                    Y = p3.Y,
                    Z = p3.Z,
                    IX = x_i,
                    IY = y_i
                };
                
                result.Points.Add(p3d);
            }
        }
        result.SizeZ = result.Points.Count;
        
        return result;
    }

    private Interaction ConvertInteraction(Point3[] points, ReFlex.gRpc.Interaction interaction, int[] mapping) {
        var success = TryParse<ReFlex.Core.Common.Util.InteractionType>(interaction.Type.ToString(), out var type);

        if (success)
        {
            type = (ReFlex.Core.Common.Util.InteractionType) interaction.Type.ConvertTo<int>();
        }
        
        var reconstructedIndex = SendCompleteDataset || mapping.Length <= interaction.PointIdx 
            ? interaction.PointIdx 
            // reconstruct former index from saved mapping
            : mapping[interaction.PointIdx];

        var point = points[reconstructedIndex];
        point.Z = interaction.Z;
        
        return new Interaction
        {
            TouchId = interaction.TouchId,
            Confidence = 1,
            Position = point,
            Time = interaction.Time,
            Type = type
        };
    }

    private async void ResetState()
    {
        await Task.Delay(2000);
        if (!IsConnected)
            IsBusy = false;
    }
    
    private async void LoadSettings()
    {
        _config = _configMgr.Settings.RemoteProcessingServiceSettingsValues;

        if (_configMgr.Settings.IsAutoStartEnabled)
        {
           StartService();
        }

        Logger.Info($"Loaded Settings for {GetType().FullName}. Connecting to '{_config.Address}'... ");
    }
    
    private async void OnSettingsChanged(RemoteProcessingServiceSettings cfg)
    {
        if (cfg == null)
            return;
        
        if (!Equals(cfg?.Address, _config?.Address) && IsConnected)
        {
            await Disconnect();
            _config = cfg;
            return;
        }

        if (IsConnected)
        {
            var configRequest = new ConfigRequest
            {
                Cutoff = (float)cfg.CutOff,
                Factor = (float)cfg.Factor
                // Algorithm = cfg.Algorithm
            };

            var changesDetected =
                _config != null &&
                (Math.Abs(_config.CutOff - cfg.CutOff) > float.Epsilon ||
                 Math.Abs(_config.Factor - cfg.CutOff) > float.Epsilon);
            
            if (changesDetected)
            {
                var response = await _client.ConfigureAsync(configRequest);
                Logger.Info(
                    $"Updated configruation of {nameof(RemoteInteractionProcessingService)} with values: {cfg.GetRemoteProcessingServiceSettingsString()}. response: {response}");
            }
        }

        _config = cfg;
    }

    private void SaveSettings()
    {
        _configMgr.Settings.RemoteProcessingServiceSettingsValues = _config;
        _configMgr.Update(_configMgr.Settings);

        Logger.Info($"Saved Settings for {typeof(RemoteInteractionProcessingService).FullName}.");
    }

}