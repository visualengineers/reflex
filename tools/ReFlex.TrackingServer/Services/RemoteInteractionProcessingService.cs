using System.Diagnostics;
using Grpc.Net.Client;
using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Interfaces;
using ReFlex.gRpc;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Server.Data.Config;
using TrackingServer.Events;
using ConfigurationManager = TrackingServer.Model.ConfigurationManager;
using Interaction = ReFlex.Core.Common.Components.Interaction;
using Math = System.Math;

namespace TrackingServer.Services;

public class RemoteInteractionProcessingService : IRemoteInteractionProcessorService, IDisposable
{
    private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
    private readonly Stopwatch _stopWatch = new();

    private InteractionProcessing.InteractionProcessingClient? _client;
    private GrpcChannel? _channel;
    private readonly ConfigurationManager _configMgr;
    private RemoteProcessingServiceSettings _config  = new();
    private readonly IEventAggregator? _eventAggregator;

    public bool IsConnected { get; private set; }

    public bool IsBusy { get; private set; }

    public bool SendCompleteDataset
    {
        get => _config.CompleteDataSet;
        set => _config.CompleteDataSet = value;
    }

    public RemoteInteractionProcessingService(ConfigurationManager configManager, IEventAggregator? eventAggregator)
    {
        _configMgr = configManager;
        _eventAggregator = eventAggregator;
        eventAggregator?.GetEvent<RequestSaveSettingsEvent>()?.Subscribe(SaveSettings);
        eventAggregator?.GetEvent<RequestLoadSettingsEvent>()?.Subscribe(LoadSettings);
        eventAggregator?.GetEvent<RemoteProcessingSettingsChangedEvent>()?.Subscribe(OnSettingsChanged);
    }

    public async void Dispose()
    {
      try
      {
        await Disconnect();

        _eventAggregator?.GetEvent<RequestSaveSettingsEvent>()?.Unsubscribe(SaveSettings);
        _eventAggregator?.GetEvent<RequestLoadSettingsEvent>()?.Unsubscribe(LoadSettings);
        _eventAggregator?.GetEvent<RemoteProcessingSettingsChangedEvent>()?.Unsubscribe(OnSettingsChanged);
      }
      catch (Exception e)
      {
        Logger.Error(e, $"Error while disconnect from {nameof(RemoteInteractionProcessingService)}");
      }
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
            if (status.ProtocolVersion != 2)
                throw new InvalidOperationException($"Remote processor protocol {status.ProtocolVersion} is incompatible; expected version 2 (2D raster). Update the Python backend.");
            if (!status.IsReady) throw new InvalidOperationException("Remote processor is not ready.");
            var configured = await _client.ConfigureAsync(new ConfigRequest
            {
                Cutoff = (float)_config.CutOff, Factor = (float)_config.Factor
            });
            IsConnected = configured.Success;
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

    public async Task<Tuple<IEnumerable<Interaction>, ProcessPerformance>> Update(PointCloud3 pointCloud, float zeroPlane, ProcessPerformance performance, bool doMeasure)
    {
        var result = new List<Interaction>();

        if (_client == null)
        {
          Logger.Warn($"{nameof(RemoteInteractionProcessingService)} not correctly initialized, {nameof(_client)} is null");
          return new Tuple<IEnumerable<Interaction>, ProcessPerformance>(result, performance);
        }

        if (IsBusy)
        {
            Logger.Warn("Processor is busy: skipping request.");
            return new Tuple<IEnumerable<Interaction>, ProcessPerformance>(result, performance);
        }

        IsBusy = true;

        try
        {
            if (doMeasure)
            {
                _stopWatch.Start();
            }

            var raster = new RemoteDepthRaster(pointCloud, _config.NumSkipValues, SendCompleteDataset);
            var values = new DepthValues1d
            {
                Width = raster.Width, Height = raster.Height, SampleStep = raster.SampleStep,
                ZeroPlane = zeroPlane
            };
            values.Z.AddRange(raster.Depths);


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

            foreach (var candidate in reply.Interactions)
            {
                try
                {
                    result.Add(raster.CreateCandidate(candidate.PointIdx, candidate.Z, candidate.TouchId, candidate.Time));
                }
                catch (ArgumentException error)
                {
                    Logger.Warn(error, "Ignoring invalid remote candidate.");
                }
            }

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

        return new Tuple<IEnumerable<Interaction>, ProcessPerformance>(result, performance);
    }

    public async Task StartService()
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
           await Task.Run(StartService);
        }

        Logger.Info($"Loaded Settings for {GetType().FullName}. Connecting to '{_config.Address}'... ");
    }

    private async void OnSettingsChanged(RemoteProcessingServiceSettings cfg)
    {
      try
      {
        if (!Equals(cfg.Address, _config.Address) && IsConnected)
        {
          await Disconnect();
          _config = cfg;
          return;
        }

        if (_client != null && IsConnected)
        {
          var configRequest = new ConfigRequest
          {
            Cutoff = (float)cfg.CutOff,
            Factor = (float)cfg.Factor
            // Algorithm = cfg.Algorithm
          };

          var changesDetected =
            (Math.Abs(_config.CutOff - cfg.CutOff) > float.Epsilon ||
             Math.Abs(_config.Factor - cfg.Factor) > float.Epsilon);

          if (changesDetected)
          {
            var response = await _client.ConfigureAsync(configRequest);
            Logger.Info(
              $"Updated configruation of {nameof(RemoteInteractionProcessingService)} with values: {cfg.GetRemoteProcessingServiceSettingsString()}. response: {response}");
          }
        }

        _config = cfg;
      }
      catch (Exception e)
      {
        Logger.Error(e);
      }
    }

    private void SaveSettings()
    {
        _configMgr.Settings.RemoteProcessingServiceSettingsValues = _config;
        _configMgr.Update(_configMgr.Settings);

        Logger.Info($"Saved Settings for {typeof(RemoteInteractionProcessingService).FullName}.");
    }

}
