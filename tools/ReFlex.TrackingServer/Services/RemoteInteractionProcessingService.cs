using System.Diagnostics;
using System.IO.Compression;
using Google.Protobuf;
using Grpc.Core;
using Grpc.Net.Client;
using Grpc.Net.Compression;
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
    private static readonly Metadata GzipRequestHeaders = new()
    {
        { "grpc-internal-encoding-request", "gzip" }
    };
    private const int CompressionThresholdBytes = 64 * 1024;

    private InteractionProcessing.InteractionProcessingClient? _client;
    private GrpcChannel? _channel;
    private bool _supportsFloat32Payload;
    private bool _requestCompressionEnabled = !string.Equals(
        Environment.GetEnvironmentVariable("REFLEX_GRPC_REQUEST_COMPRESSION"), "identity",
        StringComparison.OrdinalIgnoreCase);
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
            _channel = GrpcChannel.ForAddress(_config.Address, new GrpcChannelOptions
            {
                CompressionProviders = new ICompressionProvider[]
                {
                    new GzipCompressionProvider(CompressionLevel.Fastest)
                }
            });
            _client = new InteractionProcessing.InteractionProcessingClient(_channel);
            var status = await _client.GetStateAsync(new StateRequest());
            if (status.ProtocolVersion != 2)
                throw new InvalidOperationException($"Remote processor protocol {status.ProtocolVersion} is incompatible; expected version 2 (2D raster). Update the Python backend.");
            if (!status.IsReady) throw new InvalidOperationException("Remote processor is not ready.");
            _supportsFloat32Payload = status.SupportsFloat32Payload;
            var configured = await _client.ConfigureAsync(new ConfigRequest
            {
                Cutoff = (float)_config.CutOff, Factor = (float)_config.Factor
            });
            IsConnected = configured.Success;
            Logger.Info($"Remote request compression: {(_requestCompressionEnabled ? "gzip (Fastest), payloads >= 64 KiB" : "identity")}.");
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
            _supportsFloat32Payload = false;
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
            var timer = doMeasure ? Stopwatch.StartNew() : null;
            var timings = doMeasure ? new Dictionary<string, double>() : null;

            var raster = new RemoteDepthRaster(pointCloud, _config.NumSkipValues, SendCompleteDataset);
            if (timer != null)
            {
                timings!["client_raster_conversion"] = timer.Elapsed.TotalMilliseconds;
                timer.Restart();
            }
            var values = new DepthValues1d
            {
                Width = raster.Width, Height = raster.Height, SampleStep = raster.SampleStep,
                ZeroPlane = zeroPlane
            };
            if (_supportsFloat32Payload)
                values.ZFloat32Le = ByteString.CopyFrom(raster.ToLittleEndianBytes());
            else
                values.Z.AddRange(raster.Depths);


            if (timer != null)
            {
                timings!["client_request_construction"] = timer.Elapsed.TotalMilliseconds;
                performance.Preparation = TimeSpan.FromMilliseconds(
                    timings["client_raster_conversion"] + timings["client_request_construction"]);
                timer.Restart();
            }

            var compress = _requestCompressionEnabled &&
                values.ZFloat32Le.Length + values.Z.Count * sizeof(float) >= CompressionThresholdBytes;
            ReFlex.gRpc.InteractionFrame reply;
            try
            {
                // Compression stays inside the measured RPC duration, including its CPU cost.
                reply = await _client.ComputeInteractionsAsync(values, headers: compress ? GzipRequestHeaders : null);
            }
            catch (RpcException error) when (compress && error.StatusCode == StatusCode.Unimplemented &&
                error.Status.Detail.Contains("compression", StringComparison.OrdinalIgnoreCase))
            {
                // An unsupported encoding is rejected before application processing.
                _requestCompressionEnabled = false;
                Logger.Warn(error, "Remote peer does not support gzip; retrying with identity encoding.");
                reply = await _client.ComputeInteractionsAsync(values);
            }

            if (timer != null)
            {
                performance.Update = timer.Elapsed;
                timings!["client_rpc_roundtrip"] = timer.Elapsed.TotalMilliseconds;
                if (reply.Timing != null && reply.Timing.Milliseconds.TryGetValue("server_total", out var serverMs))
                {
                    foreach (var stage in reply.Timing.Milliseconds)
                        timings[stage.Key] = stage.Value;
                    timings["client_transport_serialization_overhead"] = Math.Max(0,
                        timings["client_rpc_roundtrip"] - serverMs);
                }
                performance.RemoteFrameId = reply.FrameId;
                performance.RemoteTimingsMs = timings;
                timer.Restart();
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
            if (timer != null)
                timings!["client_response_conversion"] = timer.Elapsed.TotalMilliseconds;
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

    public async Task ReportPerformance(ProcessPerformance measurement)
    {
        if (_client == null || measurement.RemoteTimingsMs == null) return;
        var sample = new TimingSample { FrameId = measurement.RemoteFrameId };
        foreach (var stage in measurement.RemoteTimingsMs)
            if (stage.Key.StartsWith("client_", StringComparison.Ordinal))
                sample.Milliseconds.Add(stage.Key, stage.Value);
        try
        {
            // Diagnostic reporting is excluded from the measured pipeline stages.
            await _client.ReportTimingAsync(sample, deadline: DateTime.UtcNow.AddSeconds(1));
        }
        catch (Grpc.Core.RpcException error)
        {
            // Older protocol-v2 backends may not implement the optional timing RPC.
            Logger.Debug(error, "Could not report remote performance diagnostics.");
        }
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
