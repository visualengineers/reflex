using System.Diagnostics;
using System.Security.Cryptography;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Util;
using Math = System.Math;

/// <summary>Paired, measurement-identical comparison; the historical tracker is generated
/// from a pinned git revision and compiled into this diagnostic executable only.</summary>
static class AssignmentComparison
{
    private static readonly string[] Names = { "Half-Circle", "Line", "Circle", "Multi-Touch" };
    private const int WarmupReplays = 10;
    private const int Repeats = 31;
    private sealed record Frame(int Index, double Time, IList<Interaction> Measurements, JObject Input, JArray Published);
    private sealed record Tracker(Func<IList<Interaction>, double, InteractionFrame> Update);

    public static void Run(string directory, string output)
    {
        Directory.CreateDirectory(output);
        var baseline = typeof(AssignmentComparison).Assembly.GetType(
            "ReFlex.Core.Interactivity.Components.GreedyInteractionSmoothingBehaviour")
            ?? throw new InvalidOperationException("Build with -p:GreedyTrackerSource=<generated historical source>.");
        using var baselineStream = typeof(AssignmentComparison).Assembly.GetManifestResourceStream("GreedyBaselineMetadata");
        using var baselineReader = new StreamReader(baselineStream);
        var baselineMetadata = JObject.Parse(baselineReader.ReadToEnd());
        using var baselineSource = typeof(AssignmentComparison).Assembly.GetManifestResourceStream("GreedyBaselineSource");
        var compiledBaselineHash = Convert.ToHexString(SHA256.HashData(baselineSource));
        if (!compiledBaselineHash.Equals((string)baselineMetadata["generatedSha256"], StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Baseline source and provenance metadata do not match.");
        var settings = JObject.Parse(File.ReadAllText("tools/ReFlex.TrackingServer/wwwroot/Config/TrackingSettings_default.json"))["FilterSettingValues"];
        var smoothing = settings["SmoothingValues"];
        var variants = new[] { (Name: "greedy", Type: baseline), (Name: "global", Type: typeof(InteractionSmoothingBehaviour)) };
        var summaries = new List<object>();
        var frameRows = new List<object>();
        var differences = new List<object>();
        var timingRows = new List<object>();
        var hashes = new Dictionary<string, string>();

        foreach (var name in Names)
        {
            var path = Path.Combine(directory, name + ".json");
            var inputPath = Path.Combine(directory, name + "-input.json");
            var data = JArray.Parse(File.ReadAllText(path));
            var inputs = JArray.Parse(File.ReadAllText(inputPath));
            if (data.Count != inputs.Count || data.Count == 0)
                throw new InvalidOperationException($"Incomplete capture/input reference: {name}");
            foreach (var file in new[] { path, inputPath })
                hashes[Path.GetFileName(file)] = Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(file)));
            var frames = data.Select((f, i) => new Frame((int)f["frame"], (double)f["time"],
                f["measurements"]?.ToObject<List<Interaction>>() ?? throw new InvalidOperationException("Fresh measurements required."),
                (JObject)inputs[i], (JArray)f["published"])).ToArray();
            if (frames.Where((f, i) => f.Index != i || (int)f.Input["frame"] != i).Any())
                throw new InvalidOperationException("Frame reference ordering mismatch.");

            Tracker Create(Type type)
            {
                var instance = Activator.CreateInstance(type, (int)smoothing["InteractionHistorySize"]);
                var properties = new Dictionary<string, object>
                {
                    ["MaxConfidence"] = (int)settings["Confidence"]["Max"],
                    ["TouchMergeDistance2D"] = (float)smoothing["TouchMergeDistance2D"],
                    ["ContactRetentionSeconds"] = (double)smoothing["ContactRetentionSeconds"],
                    ["ObservationTimeoutSeconds"] = (double)data[0]["observationTimeoutSeconds"],
                    ["UseVelocityForMapping"] = true, ["NumFramesForPrediction"] = 3,
                    ["NumFramesSmoothing"] = (int)smoothing["NumSmoothingSamples"],
                    ["DepthScale"] = (float)smoothing["DepthScale"]
                };
                foreach (var (property, value) in properties) type.GetProperty(property).SetValue(instance, value);
                type.GetMethod("UpdateFilterType").Invoke(instance, new object[] { (FilterType)(int)smoothing["Type"] });
                // Bind once, outside timing. Both implementations use the identical typed delegate.
                var update = type.GetMethod("Update", new[] { typeof(IList<Interaction>), typeof(double) })
                    .CreateDelegate<Func<IList<Interaction>, double, InteractionFrame>>(instance);
                return new Tracker(update);
            }

            List<Interaction> Publish(InteractionFrame result)
            {
                var published = new List<Interaction>();
                foreach (var item in result.Interactions.Where(i => i.Confidence > (float)settings["Confidence"]["Min"])
                    .OrderBy(i => i.TrackingState == InteractionTrackingState.Lost)
                    .ThenByDescending(i => i.Confidence).ThenBy(i => i.TouchId))
                    if (published.All(p => Point3.Squared2DDistance(p.Position, item.Position) >= (float)settings["DistanceValue"]["InputDistance"]))
                        published.Add(item);
                return published;
            }
            bool IsTarget(Interaction item) => name != "Half-Circle" ||
                Math.Pow(item.Position.X - 249, 2) + Math.Pow(item.Position.Y - 210, 2) > 60 * 60;

            var greedyOutputs = new List<JToken>();
            var greedyPublished = new List<JToken>();
            foreach (var variant in variants)
            {
                var differingTrackerFrames = 0;
                var differingPublishedFrames = 0;
                var tracker = Create(variant.Type);
                int births = 0, switches = 0, active = 0, missing = 0, previousId = -1, validationMismatches = 0;
                var previousActive = false;
                var publishedIds = new HashSet<int>();
                foreach (var f in frames)
                {
                    var result = tracker.Update(f.Measurements, f.Time);
                    var trackerOutput = JToken.FromObject(result.Interactions);
                    var published = Publish(result);
                    var publishedOutput = JToken.FromObject(published);
                    var trackerDiffers = variant.Name == "global" && !JToken.DeepEquals(trackerOutput, greedyOutputs[f.Index]);
                    var publishedDiffers = variant.Name == "global" && !JToken.DeepEquals(publishedOutput, greedyPublished[f.Index]);
                    if (variant.Name == "greedy") { greedyOutputs.Add(trackerOutput); greedyPublished.Add(publishedOutput); }
                    if (trackerDiffers) differingTrackerFrames++;
                    if (publishedDiffers) differingPublishedFrames++;
                    if (trackerDiffers || publishedDiffers)
                        differences.Add(new { recording = name, frame = f.Index, measurements = f.Measurements,
                            greedy_tracks = greedyOutputs[f.Index], global_tracks = trackerOutput,
                            greedy_published = greedyPublished[f.Index], global_published = publishedOutput });
                    // Ensure the measurement replay reconstructs the captured production output.
                    // This check applies to the global tracker, which generated the capture.
                    if (variant.Name == "global")
                    {
                        var actual = JToken.FromObject(published);
                        if (!JToken.DeepEquals(actual, JToken.FromObject(f.Published.ToObject<List<Interaction>>()))) validationMismatches++;
                    }
                    var newIds = result.Interactions.Where(i => i.TrackingState == InteractionTrackingState.Tentative).ToArray();
                    births += newIds.Length;
                    var target = published.Where(IsTarget).ToArray();
                    var representative = target.OrderBy(i => Math.Pow(i.Position.X - (double)f.Input["x"], 2)
                        + Math.Pow(i.Position.Y - (double)f.Input["y"], 2)).FirstOrDefault();
                    var isActive = (bool)f.Input["aboveThreshold"];
                    var changed = isActive && previousActive && previousId >= 0 && representative != null
                        && representative.TouchId != previousId;
                    if (changed) switches++;
                    if (isActive) { active++; if (target.Length == 0) missing++; }
                    previousId = representative?.TouchId ?? -1;
                    previousActive = isActive;
                    foreach (var item in target) publishedIds.Add(item.TouchId);
                    frameRows.Add(new { recording = name, variant = variant.Name, frame = f.Index,
                        measurements = f.Measurements.Count, births = newIds.Length,
                        lost = result.Interactions.Count(i => i.TrackingState == InteractionTrackingState.Lost),
                        published = published.Count, input_active = isActive,
                        representative_id = representative?.TouchId,
                        representative_change_consecutive_active_outputs = changed,
                        tracker_output_differs_from_greedy = variant.Name == "global" ? (bool?)trackerDiffers : null,
                        published_output_differs_from_greedy = variant.Name == "global" ? (bool?)publishedDiffers : null,
                        published_ids = string.Join(" ", published.Select(i => i.TouchId)) });
                }
                if (variant.Name == "global" && validationMismatches != 0)
                    throw new InvalidOperationException($"{name}: {validationMismatches} global outputs differ from the production capture.");
                summaries.Add(new { recording = name, variant = variant.Name, frames = frames.Length,
                    measurements = frames.Sum(f => f.Measurements.Count), created_tracks = births,
                    // Multi-Touch has no annotated individual finger trajectories.
                    id_changes_consecutive_active_outputs = name == "Multi-Touch" ? (int?)null : switches,
                    strongest_region_representative_changes = switches,
                    active_input = active, active_without_output = missing, published_target_ids = publishedIds.Count,
                    production_output_mismatches = variant.Name == "global" ? (int?)validationMismatches : null,
                    tracker_output_frames_differing_from_greedy = variant.Name == "global" ? (int?)differingTrackerFrames : null,
                    published_output_frames_differing_from_greedy = variant.Name == "global" ? (int?)differingPublishedFrames : null });
            }

            // Warm up both complete paths, including prediction and smoothing, before measurement.
            for (var warmup = 0; warmup < WarmupReplays; warmup++)
                foreach (var variant in variants)
                {
                    var tracker = Create(variant.Type);
                    foreach (var f in frames) tracker.Update(f.Measurements, f.Time);
                }
            var timings = variants.ToDictionary(v => v.Name, _ => new List<double>());
            var sequenceTotals = variants.ToDictionary(v => v.Name, _ => new List<double>());
            for (var repeat = 0; repeat < Repeats; repeat++)
            {
                // AB/BA ordering reduces systematic drift between variants.
                foreach (var variant in repeat % 2 == 0 ? variants : variants.Reverse().ToArray())
                {
                    var tracker = Create(variant.Type);
                    double totalUs = 0;
                    foreach (var f in frames)
                    {
                        var before = Stopwatch.GetTimestamp();
                        var result = tracker.Update(f.Measurements, f.Time);
                        var us = (Stopwatch.GetTimestamp() - before) * 1_000_000.0 / Stopwatch.Frequency;
                        GC.KeepAlive(result);
                        timings[variant.Name].Add(us);
                        totalUs += us;
                    }
                    sequenceTotals[variant.Name].Add(totalUs);
                    timingRows.Add(new { recording = name, variant = variant.Name, repeat,
                        order = repeat % 2 == 0 ? "greedy/global" : "global/greedy", frames = frames.Length, update_total_us = totalUs });
                }
            }
            foreach (var variant in variants)
            {
                var values = timings[variant.Name].Order().ToArray();
                summaries.Add(new { recording = name, variant = variant.Name, timing = true, repeats = Repeats,
                    measured_updates = values.Length, update_median_us = Quantile(values, .5), update_p95_us = Quantile(values, .95),
                    replay_total_median_us = Quantile(sequenceTotals[variant.Name].Order().ToArray(), .5) });
            }
            Console.WriteLine($"{name}: {frames.Length} frames, metrics and {Repeats} paired timing replays completed");
        }
        File.WriteAllText(Path.Combine(output, "results.json"), JsonConvert.SerializeObject(new {
            metadata = new { captured_at_utc = DateTimeOffset.UtcNow, baseline = baselineMetadata,
                source_sha256 = new[] {
                    "library/src/Core/Interactivity/Components/InteractionSmoothingBehaviour.cs",
                    "library/src/Core/Interactivity/Util/MinimumCostAssignment.cs",
                    "scripts/touchid-analysis/AssignmentComparison.cs",
                    "tools/ReFlex.TrackingServer/wwwroot/Config/TrackingSettings_default.json"
                }.ToDictionary(path => path, path => Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(path)))),
                configuration = new { settings = settings.DeepClone(), prediction = "linear, 3 samples", gate = "strict Manhattan",
                    nominal_hz = 30, consolidation_radius_px = 3 }, runtime = System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription,
                os = System.Runtime.InteropServices.RuntimeInformation.OSDescription,
                architecture = System.Runtime.InteropServices.RuntimeInformation.ProcessArchitecture.ToString(),
                processors = Environment.ProcessorCount, stopwatch_frequency = Stopwatch.Frequency,
                warmup_replays = WarmupReplays, timing_repeats = Repeats,
                miss_cost = .5, birth_cost = .5, input_hashes = hashes }, results = summaries }, Formatting.Indented) + "\n");
        File.WriteAllText(Path.Combine(output, "differences.json"), JsonConvert.SerializeObject(differences, Formatting.Indented) + "\n");
        WriteCsv(Path.Combine(output, "frames.csv"), frameRows);
        WriteCsv(Path.Combine(output, "timing-replays.csv"), timingRows);
    }

    private static double Quantile(double[] sorted, double probability) => sorted[(int)Math.Ceiling(sorted.Length * probability) - 1];
    private static void WriteCsv(string path, List<object> rows)
    {
        using var writer = new StreamWriter(path);
        var objects = rows.Select(JObject.FromObject).ToArray();
        var keys = objects[0].Properties().Select(p => p.Name).ToArray();
        writer.WriteLine(string.Join(",", keys));
        foreach (var row in objects)
            writer.WriteLine(string.Join(",", keys.Select(key => "\"" + (row[key]?.ToString(Formatting.None) ?? "")
                .Trim('"').Replace("\"", "\"\"") + "\"")));
    }
}
