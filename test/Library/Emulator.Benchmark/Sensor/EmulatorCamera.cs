using NLog;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Networking.Event;
using ReFlex.Core.Networking.Util;
using ReFlex.Core.Tracking.Interfaces;
using ReFlex.Core.Tracking.Util;
using EmulatedPointCloud = Emulator.Benchmark.Networking.Util.EmulatedPointCloud;
using WebSocketServer = ReFlex.Core.Networking.Components.WebSocketServer;

namespace ReFlex.Sensor.EmulatorModule
{
  public class EmulatorCamera : WebSocketServer, IDepthCamera
  {
    #region Fields

    private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

    private EmulatedPointCloud? _pointCloud;
    private readonly int _port;
    private readonly EmulatorService? _service = new();

    #endregion

    #region Properties

    public string ModelDescription => $"Emulator [{Address}]";

    public CameraType CameraType => CameraType.Emulator;

    public DepthCameraState State
    {
      get
      {
        if (!IsStarted)
          return DepthCameraState.Disconnected;
        return IsStarted ? DepthCameraState.Streaming : DepthCameraState.Connected;
      }
    }

    public StreamParameter StreamParameter { get; private set; } = new(100, 100, 30);

    #endregion

    #region Events

    public event EventHandler<DepthCameraState>? StateChanged;
    public event EventHandler<DepthCameraFrame>? FrameReady;
    public event EventHandler<ImageByteArray>? DepthImageReady;

    #endregion

    #region Constructor

    public EmulatorCamera() : this("127.0.0.1", 8080, "Emulator")
    {
    }

    /// <summary>
    /// creates the <see cref="ReFlex.Core.Networking.Components.WebSocketClient"/>
    /// </summary>
    /// <param name="address">address to which the emulator sends its websocket events</param>
    /// <param name="port">the port on which they communicate</param>
    /// <param name="endpoint">endpoint of the eumlator</param>
    public EmulatorCamera(string address, int port, string endpoint) : base(address, port, endpoint)
    {
      _port = port;
      StateChanged?.Invoke(this, State);

      StreamParameter = GetPossibleConfigurations()[0];
      _pointCloud = new EmulatedPointCloud(ComputeEmulatorParameters(StreamParameter));
    }

    #endregion

    /// <summary>
    ///
    /// </summary>
    public void Initialize()
    {
      // nothing to do here...
    }

    /// <summary>
    /// initialize (fake) depth value
    /// </summary>
    /// <param name="parameter"></param>
    public void EnableStream(StreamParameter parameter)
    {
      StreamParameter = parameter;
      var param = ComputeEmulatorParameters(parameter);

      _pointCloud = new EmulatedPointCloud(param);
      _pointCloud.InitializePointCloud(parameter);
    }

    public IList<StreamParameter> GetPossibleConfigurations()
    {
      var configs = new List<StreamParameter>
      {
        new StreamParameter(50, 50, 30),
        new StreamParameter(64, 36, 30),
        new StreamParameter(64, 48, 30),
        new StreamParameter(100, 100, 30),
        new StreamParameter(128, 72, 30),
        new StreamParameter(128, 96, 30),
        new StreamParameter(640, 480, 30),
        new StreamParameter(800, 600, 30),
        new StreamParameter(1920, 1080, 30),
        new StreamParameter(2560, 1440, 30)
      };

      return configs;
    }

    public void StartStream()
    {
      Start();
      StateChanged?.Invoke(this, State);
    }

    public void StopStream()
    {
      Stop();
      StateChanged?.Invoke(this, State);
    }


    protected override void InitServices()
    {
      Server?.AddWebSocketService(Endpoint, () => _service);

      _service.InteractionsReceived += InteractionsReceivedFromEmulatorInstance;

      _service.Closed += OnServiceClosed;
    }

    public void InteractionsReceivedFromEmulatorInstance(object? sender, InteractionsReceivedEventArgs e)
    {
      if (_pointCloud == null)
        return;

      _pointCloud.Reset();
      _pointCloud.UpdateFromInteractions(e.Interactions);
      FrameReady?.Invoke(this, new DepthCameraFrame { Depth = _pointCloud.Points });
      DepthImageReady?.Invoke(this, _pointCloud.GetUpdatedDepthImage());
    }

    private void OnServiceClosed(object? sender, EventArgs args)
    {
      Logger.Warn($"[{GetType().Name}]: Handling Closed Event for WebsocketService. Restarting...");

      Stop();
      if (_service != null)
        _service.Closed -= OnServiceClosed;
      Server?.RemoveWebSocketService(Endpoint);

      Start();

      Logger.Info($"[{GetType().Name}]: Restarting Complete.");
    }

    private EmulatorParameters ComputeEmulatorParameters(StreamParameter streamParams) {
      return new EmulatorParameters
      {
        HeightInMeters = 1.6f,
        WidthInMeters = 2.4f,
        MaxDepthInMeter = 2.1f,
        MinDepthInMeter = 0.8f,
        PlaneDistanceInMeter = 1.45f,
        Radius = (int) (streamParams.Width * 0.4)
      };
    }
  }
}
