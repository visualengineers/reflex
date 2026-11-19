# TouchId replay diagnostics

Run from the repository root with the recordings present in the TrackingServer's `wwwroot/recordings` directory. Requires the repository's .NET SDK and restored dependencies; the summarizer uses Python's standard library.

```sh
dotnet run --project test/touchid-analysis/TouchIdAnalysis.csproj -- /tmp/reflex-touchid-analysis
dotnet run --no-build --project test/touchid-analysis/TouchIdAnalysis.csproj -- --inputs /tmp/reflex-touchid-analysis
dotnet run --no-build --project test/touchid-analysis/TouchIdAnalysis.csproj -- --analyze /tmp/reflex-touchid-analysis
python3 test/touchid-analysis/summarize.py /tmp/reflex-touchid-analysis test/analysis/touchid-3512
```

Captures use the actual ReplayCamera and production filter/observer/manager classes, with nominal timestamps to isolate association from machine speed. They process every frame once, without wrapping to the start. Existing capture files are reused; use a fresh directory to capture again. Files contain pre-assignment `measurements` with detector confidence, the assigned history (`clean`), diagnostics including suppression reasons, final interactions and a SingleTouch control. Raw candidate counts and confidence ranges are stored without retaining large lists of pixel candidates.

`--inputs` independently decodes the original JPEGs using the ReplayCamera RGB24 depth mapping and records the strongest deformation. For Half-Circle, the stationary pressure region at (249,210), radius 60 pixels, is excluded when assessing the moving contact. This is a recording-specific diagnostic assumption, not a proposed tracking algorithm.

`--analyze` compares tracker behavior on the same measurements (preserving detector confidence in new captures; historical captures fall back to the old zero-confidence contract): prediction off, linear 3/9 samples, quadratic 3, larger gate, confidence threshold 2, and every other frame. It additionally produces controlled reversal and assignment examples using the current tracker (the legacy `greedy.json` filename does not select a greedy implementation). Its representative-switch metric uses the strongest classified candidate and includes transitions across gaps; the CSV summarizer instead uses source-image positions and counts changes only across consecutive active output frames. Track births include every internal candidate track, including stationary and suppressed tracks. `linear3-merge3` additionally consolidates original captures without a `measurements` field, isolating the merge effect from the confidence fix; it aliases `linear3` for new captures that are already consolidated.

To inspect processing-age expiry with the real monotonic clock, run a short MultiTouch-only capture into a separate directory:

```sh
REFLEX_WALL_CLOCK=1 REFLEX_FRAME_LIMIT=12 dotnet run --no-build --project test/touchid-analysis/TouchIdAnalysis.csproj -- /tmp/reflex-touchid-wall-production
```

This measures a synchronous diagnostic pipeline in the selected build configuration, not full server timer/remote/network throughput. It includes filtering, vector-field computation, snapshot construction and interaction analysis. SingleTouch control updates are omitted in this mode. The nominal capture still runs both observer types. The default profile is deliberately `TrackingSettings_default.json`, whose 1.45 m plane matches ReplayCamera; the stored Kinect configuration does not.

Original results: [analysis.md](../analysis/touchid-3512/analysis.md). The implemented consolidation and confidence correction, including the before/after replay comparison and real-clock limitation, are described in [implementation.md](../analysis/touchid-3512/implementation.md). Set `REFLEX_MERGE_RADIUS` when capturing to override the configured pixel radius (default 3, zero disables consolidation). Use a fresh output directory for every variant.


## Paired greedy/global assignment comparison

The comparison uses all four recordings, including Multi-Touch. A historical tracker is compiled
into the diagnostic executable only, after renaming its class. Production sources are not switched.
The current global tracker generates one shared capture of pre-assignment measurements; both
trackers subsequently receive exactly these measurements with nominal observation timestamps.

From the repository root, using a fresh capture directory:

```sh
python3 test/touchid-analysis/prepare_greedy_baseline.py 1877755ef80934f5800eb3f5a717bb9d18d508cb /tmp/reflex-assignment-baseline/GreedyInteractionSmoothingBehaviour.cs
dotnet build test/touchid-analysis/TouchIdAnalysis.csproj -c Release --no-restore -m:1 -nr:false -p:GreedyTrackerSource=/tmp/reflex-assignment-baseline/GreedyInteractionSmoothingBehaviour.cs
dotnet run --no-build -c Release --project test/touchid-analysis/TouchIdAnalysis.csproj -- /tmp/reflex-assignment-new
dotnet run --no-build -c Release --project test/touchid-analysis/TouchIdAnalysis.csproj -- --inputs /tmp/reflex-assignment-new
dotnet run --no-build -c Release --project test/touchid-analysis/TouchIdAnalysis.csproj -- --compare-assignment /tmp/reflex-assignment-new /tmp/reflex-assignment-results
```

`results.json` records metrics, build/input hashes and runtime information. `frames.csv` records
per-frame counts and differences, `differences.json` contains the full differing track and published
outputs, and `timing-replays.csv` records every measured replay total. Both full tracker outputs and
published outputs are compared. Reconstructed global published outputs must match the original
production capture in every frame, otherwise the comparison aborts.

Timing measures only the typed `Tracker.Update` call, including forecast, assignment, history,
confidence and smoothing. It excludes parsing, tracker construction, reference evaluation and
publication filtering. There are ten complete warm-up replays per variant, then 31 measured
replays in alternating AB/BA order. A second process can be run with another output directory
to inspect process-to-process variation.

The three moving-contact recordings use the existing consecutive-active-output ID-change metric.
Multi-Touch lacks finger annotations; its strongest-region representative changes are a diagnostic
count, not physical finger ID switches. Created tracks include tentative, stationary and suppressed
contacts. See [the replay comparison](../analysis/touchid-3512/assignment-comparison.md)
for the measured results and limits.
