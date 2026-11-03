using Math = System.Math;
using System.Diagnostics;
using Implementation.Components;
using Implementation.Interfaces;
using Newtonsoft.Json;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Interfaces;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Interfaces;
using ReFlex.Core.Tracking.Util;
using ReFlex.Sensor.EmulatorModule;
using ReFlex.Server.Data.Config;

// Run from repository root. Production camera, filters, snapshot, observer and manager;
// nominal recording time isolates association from machine speed and timer scheduling.
if (args.FirstOrDefault() == "--inputs") { InputAnalysis.Run(args[1]); return; }
if (args.FirstOrDefault() == "--analyze") { Analysis.Run(args[1]); return; }
var root = Directory.GetCurrentDirectory();
var output = args.FirstOrDefault() ?? Path.Combine(root, "artifacts/touchid-analysis");
Directory.CreateDirectory(output);
var settingsPath = Path.Combine(root, "tools/ReFlex.TrackingServer/wwwroot/Config/TrackingSettings_default.json");
var settings = JsonConvert.DeserializeObject<SettingsEnvelope>(File.ReadAllText(settingsPath)).FilterSettingValues;
Directory.SetCurrentDirectory(Path.Combine(root, "tools/ReFlex.TrackingServer"));
foreach (var name in new[] { "Half-Circle", "Line", "Circle" })
{
    if (File.Exists(Path.Combine(output, name + ".json"))) { Console.WriteLine($"{name}: using saved capture"); continue; }
    var camera = new DepthStreamReplayCamera();
    var config = camera.GetPossibleConfigurations().Single(c => c.Name == name);
    var count = Math.Min(RecordingUtils.GetFrames(name).Count(),
        int.TryParse(Environment.GetEnvironmentVariable("REFLEX_FRAME_LIMIT"), out var limit) ? limit : int.MaxValue);
    var clock = new Clock();
    var filter = MakeFilter(settings);
    var source = new Source(config.Width, config.Height);
    using var multi = new Manager(source, clock, settings, false);
    using var single = new Manager(source, clock, settings, true);
    var frames = new List<object>();
    var completion = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
    var captured = 0;
    camera.FrameReady += (_, frame) =>
    {
        try
        {
            if (captured >= count) return;
            clock.Now = 100 + captured / (double)config.Framerate;
            var observedAt = clock.Now;
            var processingClock = Stopwatch.StartNew();
            filter.FilterAndUpdate(frame.Depth, source.PointCloud);
            source.VectorField.Populate(source.PointCloud);
            var extreme = SingleInteractionObserver.FindGlobalExtreme(source.PointCloud, settings.DistanceValue.Default);
            source.Emit(++captured, observedAt);
            multi.Update().GetAwaiter().GetResult();
            if (Environment.GetEnvironmentVariable("REFLEX_WALL_CLOCK") != "1")
                single.Update().GetAwaiter().GetResult();
            frames.Add(new { frame = captured - 1, time = observedAt, processingMs = processingClock.Elapsed.TotalMilliseconds, extreme,
                rawCount = multi.Probe.RawCount,
                rawConfidenceRange = new[] { multi.Probe.MinRawConfidence, multi.Probe.MaxRawConfidence },
                clean = multi.Clean, tracks = multi.Diagnostics,
                published = multi.Interactions, single = single.Interactions });
            if (captured % 100 == 0) Console.WriteLine($"{name}: {captured}/{count}");
            if (captured == count) { camera.StopStream(); completion.TrySetResult(); }
        }
        catch (Exception e) { camera.StopStream(); completion.TrySetException(e); }
    };
    var stopped = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
    camera.StateChanged += (_, state) => { if (state == DepthCameraState.Connected) stopped.TrySetResult(); };
    camera.EnableStream(config);
    camera.StartStream();
    try { await completion.Task.WaitAsync(TimeSpan.FromMinutes(10)); }
    finally { camera.StopStream(); await stopped.Task.WaitAsync(TimeSpan.FromSeconds(5)); }
    File.WriteAllText(Path.Combine(output, name + ".json"), JsonConvert.SerializeObject(frames));
    Console.WriteLine($"{name}: saved {frames.Count} frames");
}

static FilterManager MakeFilter(FilterSettings s)
{
    var f = new FilterManager { DefaultDistance = s.DistanceValue.Default, MeasurePerformance = false,
        LimitationFilterType = s.LimitationFilterType, IsLimitationFilterEnabled = s.IsLimitationFilterEnabled,
        IsValueFilterEnabled = s.IsValueFilterEnabled, IsThresholdFilterEnabled = s.IsThresholdFilterEnabled,
        IsBoxFilterEnabled = s.IsBoxFilterEnabled, UseOptimizedBoxFilter = s.UseOptimizedBoxFilter };
    f.LimitationFilter.LeftBound = s.BorderValue.Left; f.LimitationFilter.RightBound = s.BorderValue.Right;
    f.LimitationFilter.UpperBound = s.BorderValue.Top; f.LimitationFilter.LowerBound = s.BorderValue.Bottom;
    f.LimitationFilter.MinDistanceFromSensor = s.MinDistanceFromSensor;
    f.ThresholdFilter.Threshold = s.Threshold;
    f.BoxFilter.Radius = s.BoxFilterRadius; f.BoxFilter.DefaultValue = s.DistanceValue.Default;
    f.BoxFilterOptimized.Radius = s.BoxFilterRadius;
    f.BoxFilterOptimized.NumPasses = s.BoxFilterNumPasses; f.BoxFilterOptimized.NumThreads = s.BoxFilterNumThreads;
    return f;
}
class SettingsEnvelope { public FilterSettings FilterSettingValues { get; set; } }
class Clock
{
    private double nominal;
    private readonly bool wall = Environment.GetEnvironmentVariable("REFLEX_WALL_CLOCK") == "1";
    public double Now { get => wall ? (double)Stopwatch.GetTimestamp() / Stopwatch.Frequency : nominal; set => nominal = value; }
}
class Probe : MultiInteractionObserver
{
    private readonly Clock clock;
    public int RawCount;
    public float MinRawConfidence, MaxRawConfidence;
    public Probe(Clock clock) => this.clock = clock;
    protected override double GetTimestampSeconds() => clock.Now;
    protected override async Task<Tuple<IEnumerable<Interaction>, ProcessPerformance>> Analyze(ProcessPerformance p)
    {
        var r = await base.Analyze(p);
        RawCount = r.Item1.Count();
        MinRawConfidence = r.Item1.Select(i => i.Confidence).DefaultIfEmpty().Min();
        MaxRawConfidence = r.Item1.Select(i => i.Confidence).DefaultIfEmpty().Max();
        return r;
    }
}
class Single(Clock clock) : SingleInteractionObserver
{
    protected override double GetTimestampSeconds() => clock.Now;
}
class Manager : InteractionManager
{
    private readonly Clock clock;
    private readonly bool single;
    public Probe Probe;
    public IList<Interaction> Clean = new List<Interaction>();
    public IList<InteractionVelocity> Diagnostics = new List<InteractionVelocity>();
    public Manager(Source source, Clock clock, FilterSettings s, bool single) : base(source, null, new Performance())
    {
        this.clock = clock; this.single = single;
        Distance = s.DistanceValue.Default; MinDistance = s.DistanceValue.Min; MaxDistance = s.DistanceValue.Max;
        InputDistance = s.DistanceValue.InputDistance; MinConfidence = s.Confidence.Min; MaxConfidence = s.Confidence.Max;
        MinAngle = s.MinAngle;
        InteractionHistorySize = s.SmoothingValues.InteractionHistorySize; NumSmoothingFrames = s.SmoothingValues.NumSmoothingSamples;
        ContactRetentionSeconds = s.SmoothingValues.ContactRetentionSeconds; TouchMergeDistance2D = s.SmoothingValues.TouchMergeDistance2D;
        DepthScale = s.SmoothingValues.DepthScale; UseVelocityPrediction = true; NumFramesForPrediction = 3;
        ExtremumTypeCheckMethod = s.ExtremumSettings.CheckMethod; ExtremumTypeCheckRadius = s.ExtremumSettings.CheckRadius;
        ExtremumTypeCheckNumSamples = s.ExtremumSettings.NumSamples; ExtremumTypeCheckFittingPercentage = s.ExtremumSettings.FitPercentage;
        Type = single ? ObserverType.SingleTouch : ObserverType.MultiTouch;
        FilterType = s.SmoothingValues.Type;
        InteractionHistoryUpdated += (_, history) => Clean = history.MaxBy(f => f.FrameId).Interactions;
        VelocitiesUpdated += (_, items) => Diagnostics = items;
    }
    protected override double GetTimestampSeconds() => clock.Now;
    protected override IInteractionObserver CreateObserver(ObserverType type) => single ? new Single(clock) : Probe = new Probe(clock);
}
class Performance : IPerformanceAggregator
{
    public bool MeasurePerformance { get; set; }
    public event EventHandler<PerformanceData> PerformanceDataUpdated { add { } remove { } }
    public void RegisterReporter(IPerformanceReporter reporter) { }
    public void UnregisterReporter(IPerformanceReporter reporter) { }
}
class Source : IDepthImageManager
{
    public Source(int w, int h) { PointCloud = new(w,h); VectorField = new(w,h); }
    public PointCloud3 PointCloud { get; }
    public VectorField2 VectorField { get; }
    public int ImageWidth => PointCloud.SizeX;
    public int ImageHeight => PointCloud.SizeY;
    public event EventHandler<TrackingObservation> ObservationReady;
    public void Emit(long sequence, double timestamp) => ObservationReady?.Invoke(this, new TrackingObservation(sequence,timestamp,PointCloud,VectorField));
    public event EventHandler<PointCloud3> PointcloudFiltered { add { } remove { } }
    public event EventHandler<VectorField2> VectorfieldChanged { add { } remove { } }
    public event EventHandler<ImageByteArray> DepthImageChanged { add { } remove { } }
    public event EventHandler<DepthCameraFrame> RawDepthFrameReceived { add { } remove { } }
    public void Initialize(int w,int h) { }
    public void Update(DepthCameraFrame frame) { }
    public void Update(ImageByteArray image) { }
}
