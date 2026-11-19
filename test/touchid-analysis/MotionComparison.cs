using System.Diagnostics;
using System.Security.Cryptography;
using System.Runtime.InteropServices;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReFlex.Core.Common.Components;
using ReFlex.Core.Common.Util;
using ReFlex.Core.Interactivity.Components;
using ReFlex.Core.Interactivity.Util;
using ReFlex.Server.Data;
using Math = System.Math;

/// <summary>Paired production-tracker replay comparisons with identical pre-assignment inputs.
/// Vary either the motion model or JPDA; publication/reference and timing logic stay shared.</summary>
static class MotionComparison
{
    private static readonly string[] Names = { "Half-Circle", "Line", "Circle", "Multi-Touch" };
    private static readonly bool[] Modes = { false, true };
    private const int Warmups = 10;
    private const int Repeats = 31;
    private sealed record Frame(int Index, double Time, IList<Interaction> Measurements, JObject Input);

    public static void Run(string directory, string output, bool qualityOnly = false)
        => RunCore(directory, output, qualityOnly, false, false);

    public static void RunJpda(string directory, string output, bool useKalmanFilter, bool qualityOnly = false)
        => RunCore(directory, output, qualityOnly, true, useKalmanFilter);

    private static void RunCore(string directory, string output, bool qualityOnly, bool compareJpda, bool fixedKalman)
    {
        string Mode(bool variant) => compareJpda ? (variant ? "jpda" : "global") : (variant ? "kalman" : "linear3");
        Directory.CreateDirectory(output);
        var settingsPath = "tools/ReFlex.TrackingServer/wwwroot/Config/TrackingSettings_default.json";
        var settings = JsonConvert.DeserializeObject<TrackingServerAppSettings>(File.ReadAllText(settingsPath));
        var filter = settings.FilterSettingValues;
        var smooth = filter.SmoothingValues;
        var summaries = new List<object>();
        var frameRows = new List<object>();
        var timingRows = new List<object>();
        var hashes = new Dictionary<string, string>();
        var numericFrames = new List<object>();
        var changeRows = new List<object>();
        var recoveryRows = new List<object>();
        var differences = new List<object>();
        var comparisons = new List<object>();

        foreach (var name in Names)
        {
            var capturePath = Path.Combine(directory, name + ".json");
            var inputPath = Path.Combine(directory, name + "-input.json");
            var data = JArray.Parse(File.ReadAllText(capturePath));
            var inputs = JArray.Parse(File.ReadAllText(inputPath));
            if (data.Count == 0 || data.Count != inputs.Count)
                throw new InvalidOperationException($"Incomplete capture: {name}");
            foreach (var path in new[] { capturePath, inputPath })
                hashes[Path.GetFileName(path)] = Hash(path);
            var frames = data.Select((frame, index) => new Frame((int)frame["frame"], (double)frame["time"],
                frame["measurements"]?.ToObject<List<Interaction>>()
                    ?? throw new InvalidOperationException("Pre-assignment measurements with actual confidence are required."),
                (JObject)inputs[index])).ToArray();
            if (frames.Where((frame, index) => frame.Index != index || (int)frame.Input["frame"] != index
                || !double.IsFinite(frame.Time) || (index > 0 && frame.Time <= frames[index - 1].Time)).Any())
                throw new InvalidOperationException($"Invalid frame/time alignment: {name}");
            var timeout = (double)data[0]["observationTimeoutSeconds"];

            InteractionSmoothingBehaviour Create(bool variant)
            {
                var tracker = new InteractionSmoothingBehaviour(smooth.InteractionHistorySize)
                {
                    UseKalmanFilter = compareJpda ? fixedKalman : variant,
                    UseJpda = compareJpda && variant, UseMinimumCostAssignment = true,
                    UseVelocityForMapping = true, NumFramesForPrediction = 3, UseSecondDerivation = false,
                    AssignmentMissCost = settings.AssignmentMissCost, AssignmentBirthCost = settings.AssignmentBirthCost,
                    MaxConfidence = filter.Confidence.Max, TouchMergeDistance2D = smooth.TouchMergeDistance2D,
                    ContactRetentionSeconds = smooth.ContactRetentionSeconds, ObservationTimeoutSeconds = timeout,
                    ConfidenceGainPerSecond = smooth.ConfidenceGainPerSecond,
                    ConfidenceDecayPerSecond = smooth.ConfidenceDecayPerSecond,
                    NumFramesSmoothing = smooth.NumSmoothingSamples, DepthScale = smooth.DepthScale,
                    PredictionHorizonSeconds = .05
                };
                tracker.UpdateFilterType(smooth.Type);
                return tracker;
            }
            List<Interaction> Publish(InteractionFrame result)
            {
                var published = new List<Interaction>();
                foreach (var item in result.Interactions.Where(i => i.Confidence > filter.Confidence.Min)
                    .OrderBy(i => i.TrackingState == InteractionTrackingState.Lost)
                    .ThenByDescending(i => i.Confidence).ThenBy(i => i.TouchId))
                    if (published.All(p => Point3.Manhattan2DDistance(p.Position, item.Position) >= filter.DistanceValue.InputDistance))
                        published.Add(item);
                return published;
            }
            bool IsTarget(Interaction item) => name != "Half-Circle" ||
                Math.Pow(item.Position.X - 249, 2) + Math.Pow(item.Position.Y - 210, 2) > 3600;
            Interaction Nearest(IEnumerable<Interaction> items, Frame frame) => items.Where(IsTarget)
                .OrderBy(i => Math.Pow(i.Position.X - (double)frame.Input["x"], 2)
                    + Math.Pow(i.Position.Y - (double)frame.Input["y"], 2)).FirstOrDefault();

            var expectedBirths = new Dictionary<bool, int>();
            var baselineFrames = new Dictionary<int, JObject>();
            int assignedDifferences = 0, trackedDifferences = 0, publishedDifferences = 0;
            foreach (var variant in Modes)
            {
                var tracker = Create(variant);
                int births = 0, switches = 0, rawSwitches = 0, missing = 0, active = 0, previousId = -1, previousRawId = -1;
                var previousActive = false;
                var publishedIds = new HashSet<int>();
                var lastMeasured = new Dictionary<int, (int Frame, double Time, Point3 Position)>();
                int reassociations = 0, beyondRetention = 0;
                var recoveredIds = new HashSet<int>();
                int approximationFrames = 0, reservationFrames = 0, maxReservations = 0, fallbackFrames = 0;
                foreach (var frame in frames)
                {
                    var allocatedBefore = tracker.CurrentMaxId;
                    var result = tracker.Update(frame.Measurements, frame.Time);
                    var diagnostics = tracker.GetVelocities(result);
                    var raw = tracker.InteractionsFramesCache.Single(f => f.FrameId == result.FrameId).Interactions;
                    var published = Publish(result);
                    // Untimed inspection reproduces the pure joint calculation from the actual stored
                    // matching targets, and verifies its assignments against the real update.
                    var audit = compareJpda ? InspectJpda(tracker, frame, raw, allocatedBefore, variant) : null;
                    if (audit?.Approximate == true) approximationFrames++;
                    if (audit?.Fallback == true) fallbackFrames++;
                    if (audit?.Reserved.Length > 0) reservationFrames++;
                    maxReservations = Math.Max(maxReservations, audit?.Reserved.Length ?? 0);
                    var newTracks = result.Interactions.Count(i => i.TrackingState == InteractionTrackingState.Tentative);
                    births += newTracks;
                    var target = Nearest(published, frame);
                    var rawTarget = Nearest(raw, frame);
                    var rawDiagnostic = rawTarget == null ? null : diagnostics.SingleOrDefault(d => d.TouchId == rawTarget.TouchId);
                    var inputActive = (bool)frame.Input["aboveThreshold"];
                    var changed = inputActive && previousActive && previousId >= 0 && target != null && target.TouchId != previousId;
                    var rawChanged = inputActive && previousActive && previousRawId >= 0 && rawTarget != null && rawTarget.TouchId != previousRawId;
                    if (changed) switches++;
                    if (rawChanged) rawSwitches++;
                    if (rawChanged)
                    {
                        // For an unassigned/lost previous track this is the same read-only forecast
                        // used by assignment at the current observation time, before any correction.
                        var previous = diagnostics.SingleOrDefault(d => d.TouchId == previousRawId);
                        var oldOutput = result.Interactions.SingleOrDefault(i => i.TouchId == previousRawId);
                        changeRows.Add(new { recording = name, mode = Mode(variant), frame = frame.Index,
                            previous_id = previousRawId, current_id = rawTarget.TouchId,
                            current_is_birth = rawTarget.TrackingState == InteractionTrackingState.Tentative,
                            previous_is_lost = previous?.IsPredicted, same_type = oldOutput == null ? (bool?)null : oldOutput.Type == rawTarget.Type,
                            measurement_x = rawTarget.Position.X, measurement_y = rawTarget.Position.Y,
                            previous_matching_x = previous?.MatchingPosition.X, previous_matching_y = previous?.MatchingPosition.Y,
                            manhattan_residual = previous == null ? (float?)null : Point3.Manhattan2DDistance(rawTarget.Position, previous.MatchingPosition),
                            gate = smooth.TouchMergeDistance2D,
                            previous_last_measured_time = previous?.LastMeasuredTimestampSeconds });
                    }
                    if (inputActive) { active++; if (target == null) missing++; }
                    previousActive = inputActive;
                    previousId = target?.TouchId ?? -1;
                    previousRawId = rawTarget?.TouchId ?? -1;
                    foreach (var item in published.Where(IsTarget)) publishedIds.Add(item.TouchId);
                    if (result.Interactions.Any(i => !float.IsFinite(i.Position.X) || !float.IsFinite(i.Position.Y)))
                        throw new InvalidOperationException("Non-finite tracking output.");
                    if ((compareJpda ? fixedKalman : variant) && diagnostics.Any(d => !d.UseKalmanFilter || d.KalmanPosition == null
                        || d.KalmanVarianceX is not >= 0 || d.KalmanVarianceY is not >= 0
                        || !double.IsFinite(d.KalmanVarianceX.Value) || !double.IsFinite(d.KalmanVarianceY.Value)))
                        throw new InvalidOperationException("Invalid Kalman diagnostics.");
                    int frameReassociations = 0, frameRecoveries = 0;
                    foreach (var item in raw)
                    {
                        if (lastMeasured.TryGetValue(item.TouchId, out var previous) && previous.Frame < frame.Index - 1)
                        {
                            reassociations++;
                            frameReassociations++;
                            var extended = frame.Time > previous.Time + smooth.ContactRetentionSeconds;
                            if (extended) { beyondRetention++; frameRecoveries++; recoveredIds.Add(item.TouchId); }
                            recoveryRows.Add(new { recording = name, mode = Mode(variant), frame = frame.Index,
                                touch_id = item.TouchId, previous_frame = previous.Frame,
                                missing_frames = frame.Index - previous.Frame - 1,
                                elapsed_seconds = frame.Time - previous.Time, beyond_normal_retention = extended,
                                previous_x = previous.Position.X, previous_y = previous.Position.Y,
                                x = item.Position.X, y = item.Position.Y,
                                published = published.Any(p => p.TouchId == item.TouchId) });
                        }
                        lastMeasured[item.TouchId] = (frame.Index, frame.Time, new Point3(item.Position));
                    }
                    var snapshot = JObject.FromObject(new { assigned = raw, tracked = result.Interactions, published,
                        targets = audit?.Targets.Select(t => new { id = t.TouchId, x = t.Position.X, y = t.Position.Y, type = t.Type }),
                        jpda_approximate = audit?.Approximate, reserved_ids = audit?.Reserved });
                    if (!variant) baselineFrames[frame.Index] = snapshot;
                    else
                    {
                        var baseline = baselineFrames[frame.Index];
                        var assignedChanged = !JToken.DeepEquals(baseline["assigned"], snapshot["assigned"]);
                        var trackedChanged = !JToken.DeepEquals(baseline["tracked"], snapshot["tracked"]);
                        var publishedChanged = !JToken.DeepEquals(baseline["published"], snapshot["published"]);
                        if (assignedChanged) assignedDifferences++;
                        if (trackedChanged) trackedDifferences++;
                        if (publishedChanged) publishedDifferences++;
                        if (assignedChanged || trackedChanged || publishedChanged)
                            differences.Add(new { recording = name, frame = frame.Index,
                                assigned_changed = assignedChanged, tracked_changed = trackedChanged,
                                published_changed = publishedChanged, baseline, candidate = snapshot });
                    }
                    frameRows.Add(new { recording = name, mode = Mode(variant), frame = frame.Index,
                        time = frame.Time, input_active = inputActive, measurements = frame.Measurements.Count,
                        births = newTracks, reassociations = frameReassociations, recoveries_beyond_retention = frameRecoveries, lost = result.Interactions.Count(i => i.TrackingState == InteractionTrackingState.Lost),
                        jpda_approximate = audit?.Approximate, jpda_fallback = audit?.Fallback,
                        reserved_ids = audit == null ? "" : string.Join(" ", audit.Reserved),
                        published = published.Count, representative_id = target?.TouchId,
                        representative_x = target?.Position.X, representative_y = target?.Position.Y,
                        representative_change_consecutive_active_outputs = changed,
                        raw_representative_id = rawTarget?.TouchId, raw_representative_change = rawChanged,
                        raw_is_birth = rawTarget?.TrackingState == InteractionTrackingState.Tentative,
                        raw_matching_x = rawDiagnostic?.MatchingPosition.X, raw_matching_y = rawDiagnostic?.MatchingPosition.Y,
                        raw_matching_distance = rawDiagnostic == null ? (float?)null
                            : Point3.Manhattan2DDistance(rawTarget.Position, rawDiagnostic.MatchingPosition),
                        published_ids = string.Join(" ", published.Select(i => i.TouchId)),
                        raw_assigned_ids = string.Join(" ", raw.Select(i => i.TouchId)) });
                    // Compact raw association trace supports later inspection without retaining full pixel detections.
                    numericFrames.Add(new { recording = name, mode = Mode(variant), frame = frame.Index,
                        assigned = raw.Select(i => new { id = i.TouchId, x = i.Position.X, y = i.Position.Y, type = i.Type, state = i.TrackingState }),
                        published = published.Select(i => new { id = i.TouchId, x = i.Position.X, y = i.Position.Y, type = i.Type, state = i.TrackingState }) });
                }
                if (births != tracker.CurrentMaxId) throw new InvalidOperationException("Birth counter does not match allocated IDs.");
                expectedBirths[variant] = births;
                summaries.Add(new { recording = name, mode = Mode(variant), frames = frames.Length,
                    measurements = frames.Sum(f => f.Measurements.Count), created_tracks = births,
                    id_changes_consecutive_active_outputs = name == "Multi-Touch" ? (int?)null : switches,
                    representative_changes = switches, raw_representative_changes = rawSwitches,
                    active_input = active, active_without_output = missing, published_target_ids = publishedIds.Count,
                    reassociations_after_gap = reassociations, recoveries_beyond_retention = beyondRetention,
                    distinct_recovered_ids_beyond_retention = recoveredIds.Count,
                    jpda_approximation_frames = approximationFrames, jpda_fallback_frames = fallbackFrames,
                    frames_with_reservations = reservationFrames, maximum_reservations = maxReservations });
            }

            comparisons.Add(new { recording = name, baseline = Mode(false), candidate = Mode(true),
                assigned_frames_different = assignedDifferences, tracked_frames_different = trackedDifferences,
                published_frames_different = publishedDifferences });
            if (qualityOnly) continue;
            // Warm both complete paths; construction and all JSON/reference work are outside the timing.
            for (var warmup = 0; warmup < Warmups; warmup++)
                foreach (var variant in Modes)
                {
                    var tracker = Create(variant);
                    foreach (var frame in frames) tracker.GetVelocities(tracker.Update(frame.Measurements, frame.Time));
                }
            var times = Modes.ToDictionary(k => k, _ => new List<(double Update, double Diagnostics)>());
            for (var repeat = 0; repeat < Repeats; repeat++)
            {
                foreach (var variant in repeat % 2 == 0 ? Modes : Modes.Reverse().ToArray())
                {
                    var tracker = Create(variant);
                    double updateTotal = 0, diagnosticsTotal = 0;
                    foreach (var frame in frames)
                    {
                        var start = Stopwatch.GetTimestamp();
                        var result = tracker.Update(frame.Measurements, frame.Time);
                        var middle = Stopwatch.GetTimestamp();
                        var diagnostics = tracker.GetVelocities(result);
                        var end = Stopwatch.GetTimestamp();
                        var update = (middle - start) * 1_000_000.0 / Stopwatch.Frequency;
                        var diagnostic = (end - middle) * 1_000_000.0 / Stopwatch.Frequency;
                        GC.KeepAlive(result);
                        GC.KeepAlive(diagnostics);
                        times[variant].Add((update, diagnostic));
                        updateTotal += update;
                        diagnosticsTotal += diagnostic;
                    }
                    if (tracker.CurrentMaxId != expectedBirths[variant])
                        throw new InvalidOperationException("Timed replay produced different births than metric replay.");
                    timingRows.Add(new { recording = name, mode = Mode(variant), repeat,
                        order = repeat % 2 == 0 ? $"{Mode(false)}/{Mode(true)}" : $"{Mode(true)}/{Mode(false)}", frames = frames.Length,
                        update_total_us = updateTotal, diagnostics_total_us = diagnosticsTotal,
                        combined_total_us = updateTotal + diagnosticsTotal });
                }
            }
            foreach (var variant in Modes)
            {
                var values = times[variant];
                summaries.Add(new { recording = name, mode = Mode(variant), timing = true,
                    repeats = Repeats, measured_updates = values.Count,
                    update_median_us = Quantile(values.Select(t => t.Update), .5), update_p95_us = Quantile(values.Select(t => t.Update), .95),
                    diagnostics_median_us = Quantile(values.Select(t => t.Diagnostics), .5), diagnostics_p95_us = Quantile(values.Select(t => t.Diagnostics), .95),
                    combined_median_us = Quantile(values.Select(t => t.Update + t.Diagnostics), .5),
                    combined_p95_us = Quantile(values.Select(t => t.Update + t.Diagnostics), .95) });
            }
            Console.WriteLine($"{name}: {frames.Length} frames, {expectedBirths[false]} → {expectedBirths[true]} births; {Repeats} paired timing replays complete");
        }
        var sources = new[] {
            "library/src/Core/Interactivity/Components/InteractionSmoothingBehaviour.cs",
            "library/src/Core/Interactivity/Util/KalmanContactMotion.cs",
            "library/src/Core/Interactivity/Util/ContactMotion.cs",
            "library/src/Core/Interactivity/Util/MinimumCostContactAssignment.cs",
            "library/src/Core/Interactivity/Util/MinimumCostAssignment.cs",
            "library/src/Core/Interactivity/Util/GreedyContactAssignment.cs",
            "library/src/Core/Common/Components/Point3.cs",
            "library/src/Core/Interactivity/Util/JpdaContactAssignment.cs",
            "test/touchid-analysis/Program.cs", "test/touchid-analysis/MotionComparison.cs", settingsPath
        };
        File.WriteAllText(Path.Combine(output, "results.json"), JsonConvert.SerializeObject(new {
            metadata = new { measured_at_utc = DateTimeOffset.UtcNow,
                runtime = RuntimeInformation.FrameworkDescription, os = RuntimeInformation.OSDescription,
                architecture = RuntimeInformation.ProcessArchitecture.ToString(), processors = Environment.ProcessorCount,
                stopwatch_frequency = Stopwatch.Frequency, warmup_replays = qualityOnly ? 0 : Warmups,
                timing_repeats = qualityOnly ? 0 : Repeats, quality_only = qualityOnly,
                input_hashes = hashes, source_sha256 = sources.ToDictionary(p => p, Hash),
                comparison = compareJpda ? "global/jpda" : "linear3/kalman",
                configuration = new { settings, global_assignment = true, pressure_type_invariant = true,
                    varied_setting = compareJpda ? "UseJpda" : "UseKalmanFilter",
                    fixed_kalman = compareJpda ? (bool?)fixedKalman : null,
                    variants = Modes.Select(v => new { mode = Mode(v), use_jpda = compareJpda && v,
                        use_kalman_filter = compareJpda ? fixedKalman : v }).ToArray(),
                    jpda_overrides_global_when_enabled = compareJpda,
                    jpda_occlusion_retention_seconds = InteractionSmoothingBehaviour.JpdaOcclusionRetentionSeconds,
                    jpda_temperature = CompiledConstant("JpdaContactAssignment", "Temperature"),
                    jpda_max_events = CompiledConstant("JpdaContactAssignment", "MaxEvents"),
                    jpda_max_tracks = CompiledConstant("JpdaContactAssignment", "MaxTracks"),
                    jpda_relative_occlusion_probability = CompiledConstant("JpdaContactAssignment", "OcclusionRelativeProbability"),
                    velocity_prediction = true, polynomial_samples = 3, polynomial_acceleration = false,
                    horizon_seconds = .05, capture_times_are_nominal = true,
                    kalman_changes_xy_smoothing = !compareJpda, kalman_measurement_variance = KalmanConstant("MeasurementVariance"),
                    kalman_acceleration_spectral_density = KalmanConstant("AccelerationSpectralDensity"),
                    kalman_initial_velocity_variance = KalmanConstant("InitialVelocityVariance") } },
            results = summaries, comparisons }, Formatting.Indented) + "\n");
        WriteCsv(Path.Combine(output, "frames.csv"), frameRows);
        WriteCsv(Path.Combine(output, "timing-replays.csv"), timingRows);
        WriteCsv(Path.Combine(output, "association-changes.csv"), changeRows);
        WriteCsv(Path.Combine(output, "reassociations.csv"), recoveryRows);
        File.WriteAllText(Path.Combine(output, "differences.json"), JsonConvert.SerializeObject(differences, Formatting.Indented) + "\n");
        File.WriteAllText(Path.Combine(output, "tracks.json"), JsonConvert.SerializeObject(numericFrames) + "\n");
    }

    private sealed record JpdaInspection((int TouchId, Point3 Position, InteractionType Type)[] Targets,
        int[] Reserved, bool? Approximate, bool Fallback);

    private static JpdaInspection InspectJpda(InteractionSmoothingBehaviour tracker, Frame frame,
        IList<Interaction> raw, int allocatedBefore, bool enabled)
    {
        const System.Reflection.BindingFlags flags = System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic;
        var states = (System.Collections.IDictionary)typeof(InteractionSmoothingBehaviour).GetField("_tracks", flags).GetValue(tracker);
        var targets = new List<(int TouchId, Point3 Position, InteractionType Type)>();
        var reserved = new List<int>();
        foreach (System.Collections.DictionaryEntry entry in states)
        {
            var id = (int)entry.Key;
            var state = entry.Value;
            object Property(string name) => state.GetType().GetProperty(name).GetValue(state);
            if (id < allocatedBefore)
                targets.Add((id, new Point3((Point3)Property("MatchingPosition")), ((Interaction)Property("LastMeasurement")).Type));
            if (Property("OccludedUntil") is double until && until >= frame.Time) reserved.Add(id);
        }
        var ordered = targets.OrderBy(t => t.TouchId).ToArray();
        bool? approximate = null;
        var fallback = enabled && ordered.Length > CompiledConstant("JpdaContactAssignment", "MaxTracks");
        if (enabled && !fallback)
        {
            var inputs = frame.Measurements.Take(20).Where(i => float.IsFinite(i.Position.X) && float.IsFinite(i.Position.Y)).ToArray();
            var type = typeof(InteractionSmoothingBehaviour).Assembly.GetType("ReFlex.Core.Interactivity.Util.JpdaContactAssignment", true);
            var joint = type.GetMethod("Assign").Invoke(null, new object[] { inputs, ordered,
                tracker.TouchMergeDistance2D, tracker.AssignmentMissCost, tracker.AssignmentBirthCost });
            approximate = (bool)joint.GetType().GetProperty("Approximate").GetValue(joint);
            var ids = (int[])joint.GetType().GetProperty("AssignedIds").GetValue(joint);
            var nextId = allocatedBefore;
            var expected = inputs.Select((item, index) => (Id: ids[index] < 0 ? nextId++ : ids[index],
                X: item.Position.X, Y: item.Position.Y, Type: item.Type)).OrderBy(i => i.Id).ToArray();
            var actual = raw.Select(i => (Id: i.TouchId, X: i.Position.X, Y: i.Position.Y, Type: i.Type)).OrderBy(i => i.Id).ToArray();
            if (!expected.SequenceEqual(actual)) throw new InvalidOperationException("JPDA inspection does not reproduce the actual association.");
        }
        return new JpdaInspection(ordered, reserved.Order().ToArray(), approximate, fallback);
    }

    // Read compiled values, so metadata cannot silently retain pre-tuning defaults.
    private static double KalmanConstant(string name) => CompiledConstant("KalmanContactMotion", name);
    private static double CompiledConstant(string type, string name) => Convert.ToDouble(typeof(InteractionSmoothingBehaviour).Assembly
        .GetType("ReFlex.Core.Interactivity.Util." + type, throwOnError: true)
        .GetField(name, System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.NonPublic)
        .GetRawConstantValue());
    private static string Hash(string path) => Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(path)));
    private static double Quantile(IEnumerable<double> values, double probability)
    {
        var sorted = values.Order().ToArray();
        return sorted[(int)Math.Ceiling(sorted.Length * probability) - 1];
    }
    private static void WriteCsv(string path, List<object> rows)
    {
        using var writer = new StreamWriter(path);
        if (rows.Count == 0) return;
        var objects = rows.Select(JObject.FromObject).ToArray();
        var keys = objects[0].Properties().Select(p => p.Name).ToArray();
        writer.WriteLine(string.Join(",", keys));
        foreach (var row in objects)
            writer.WriteLine(string.Join(",", keys.Select(key => "\"" +
                (row[key]?.Type == JTokenType.String ? row[key].Value<string>() : row[key]?.ToString(Formatting.None) ?? "")
                .Replace("\"", "\"\"") + "\"")));
    }
}
