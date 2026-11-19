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

## Paired linear prediction/Kalman comparison

`--compare-motion` compares the current production tracker with `UseKalmanFilter=false/true`.
Both variants use global assignment and the current hard pressure-type constraint. Only the Kalman
switch changes; this also changes published XY smoothing. Prediction is enabled with three samples
and no acceleration in the legacy mode. All other settings and explicit overrides are recorded in
`results.json`. The historical greedy tracker is not needed for this comparison.

From the repository root, after building Release:

```sh
dotnet build test/touchid-analysis/TouchIdAnalysis.csproj -c Release --no-restore -m:1 -nr:false
# Capture only if an existing capture with pre-assignment measurements is not available.
dotnet run --no-build -c Release --project test/touchid-analysis/TouchIdAnalysis.csproj -- /tmp/reflex-motion-capture
dotnet run --no-build -c Release --project test/touchid-analysis/TouchIdAnalysis.csproj -- --inputs /tmp/reflex-motion-capture
dotnet run --no-build -c Release --project test/touchid-analysis/TouchIdAnalysis.csproj -- --compare-motion /tmp/reflex-motion-capture /tmp/reflex-motion-results/process-1
dotnet run --no-build -c Release --project test/touchid-analysis/TouchIdAnalysis.csproj -- --compare-motion /tmp/reflex-motion-capture /tmp/reflex-motion-results/process-2
```

Run the two measurement processes sequentially. The documented comparison reuses
`/tmp/reflex-assignment-20261119`, whose eight input hashes match the earlier assignment comparison.
New captures may have different hashes if preprocessing changed; both variants must always receive
the same captured measurements. Nominal 30 Hz capture times isolate association from execution speed.

`frames.csv` records published and raw representative ID changes and births; `tracks.json` retains
compact assigned/published trajectories. `association-changes.csv` records the current measurement
and previous ID's matching forecast when the raw representative changes. A previous Lost track's
forecast is queried at the current observation time, without a correction; if the previous track
is no longer available, its diagnostic fields are empty. Multi-Touch changes are representative
diagnostics, not annotated physical finger switches.

Timing measures `Tracker.Update` and `GetVelocities` separately, after ten whole-replay warmups,
with 31 alternating AB/BA replays per recording and fresh state for each replay. Combined per-frame
median/p95 include both calls; replay totals are stored in `timing-replays.csv`. Parsing, image
processing, publication filtering, calibration and UI rendering are excluded. Runtime checks validate
finite outputs/covariances and identical birth counts across quality and timed replays.

See [the Kalman replay report](../analysis/touchid-3512/kalman-comparison.md) for results,
parameter assumptions, the initial ID-stability regression, tuned results and interpretation limits.

For an offline parameter sweep, use the production tracker with timing disabled:

```sh
python3 test/touchid-analysis/tune_kalman.py /tmp/reflex-motion-capture /tmp/reflex-kalman-noise-grid.json
```

The default grid has eight process spectral densities (400 through 4000000) and three measurement
variances (1, 4, 16), with initial velocity variance fixed at 10000. Explicit `--q`, `--r` and
`--velocity-variance` lists can override the grid. The script temporarily edits the three production
constants, builds each candidate with shared compilation disabled, then calls `--compare-motion`
with `--quality-only`. Compiled constants are checked against each requested candidate; result
metadata reads the actual compiled constants rather than hardcoded analysis defaults.
Every candidate's quality metrics, settings and hashes are retained in the grid JSON. The original
source is restored and rebuilt on normal or exception exit; abrupt process termination cannot run
that cleanup. Do not concurrently edit the Kalman source or build the same projects during a sweep.
No mutable tuning controls are added to the application.

The repeat comparison with selected production defaults is stored separately in the report's
`kalman-comparison/tuned/process-1` and `process-2` directories; original results are preserved.
Use the full comparison command without `--quality-only` to measure timing after choosing defaults.

## Paired global/JPDA comparison

`--compare-jpda` toggles only `UseJpda` on the current production tracker. Both variants retain
`UseMinimumCostAssignment=true`; JPDA overrides that selection in the enabled variant. The default
comparison uses linear prediction without Kalman. `--kalman` enables the tuned Kalman model in
**both** variants. Input measurements, motion settings, costs and publication logic are shared.

Reuse a capture directory containing all four pre-assignment `*.json` files and their
`*-input.json` references, or generate one using the capture/`--inputs` commands above. From the
repository root:

```sh
dotnet build test/touchid-analysis/TouchIdAnalysis.csproj -c Release --no-restore -m:1 -nr:false -p:UseSharedCompilation=false
dotnet run --no-build -c Release --project test/touchid-analysis/TouchIdAnalysis.csproj -- --compare-jpda /tmp/reflex-assignment-20261119 test/analysis/touchid-3512/jpda-comparison/linear/process-1
dotnet run --no-build -c Release --project test/touchid-analysis/TouchIdAnalysis.csproj -- --compare-jpda /tmp/reflex-assignment-20261119 test/analysis/touchid-3512/jpda-comparison/kalman/process-1 --kalman
dotnet run --no-build -c Release --project test/touchid-analysis/TouchIdAnalysis.csproj -- --compare-jpda /tmp/reflex-assignment-20261119 test/analysis/touchid-3512/jpda-comparison/linear/process-2
dotnet run --no-build -c Release --project test/touchid-analysis/TouchIdAnalysis.csproj -- --compare-jpda /tmp/reflex-assignment-20261119 test/analysis/touchid-3512/jpda-comparison/kalman/process-2 --kalman
python3 test/touchid-analysis/verify_jpda_comparison.py /tmp/reflex-assignment-20261119 test/analysis/touchid-3512/jpda-comparison
```

Run measurement processes sequentially, without concurrent builds/tests. Each performs ten complete
warm-up replays and 31 alternating AB/BA measured replays per recording, with fresh state each time.
The timing scope is unchanged: separate `Tracker.Update` and `GetVelocities` intervals, excluding
publication filtering, inspection, metrics, serialization, detector processing and UI/network work.
`--quality-only` skips warm-up/timing for exploratory checks.

Additional diagnostics:

- `reassociations.csv` records actual reuse of an ID after a measurement gap and whether it exceeds
  ordinary retention. This is distinct from merely reserving a masked ID.
- `frames.csv` records active reservations and joint-event approximation/fallback flags. Untimed
  reflection reads the actual private matching targets/reservations; the pure joint calculation is
  independently rerun and its hard assignments must reproduce the actual update.
- `differences.json` retains complete assigned/tracked/published differences and matching targets.
- `results.json` includes per-variant overrides, compiled JPDA/Kalman constants, input/source hashes,
  quality metrics, frame-difference counts and separate/combined timing quantiles.
- The Python verifier reconstructs metrics independently from saved tracks and source-image
  references, validates hashes, replay totals and process agreement, and writes `summary.json` with
  weighted timing means and output-deviation details. It intentionally checks the archived 81 px
  gate, 0.5 costs and 0.1 s ordinary retention. Use `--skip-source-check` only to audit an archived
  result after its measured source files have changed; artifact/input checks still run.

See [the JPDA replay report](../analysis/touchid-3512/jpda-comparison.md) for results and limitations.

## JPDA runtime optimization comparison

The optimized implementation retains the same beam, event scores, stable tie ordering and recovery
rules. To compare its runtime fairly, the diagnostic executable can also compile the original
tracker and private motion/assignment helpers from commit `4290171a`. The preparation script only
prefixes type names with `Baseline`; production projects never compile those generated sources.
Embedded source hashes are checked at runtime, and the verifier reconstructs them from git.

```sh
python3 test/touchid-analysis/prepare_jpda_baseline.py 4290171a /tmp/reflex-jpda-original
dotnet build test/touchid-analysis/TouchIdAnalysis.csproj -c Release --no-restore -m:1 -nr:false -p:UseSharedCompilation=false -p:JpdaBaselineDirectory=/tmp/reflex-jpda-original
dotnet run --no-build -c Release --project test/touchid-analysis/TouchIdAnalysis.csproj -- --compare-jpda-optimization /tmp/reflex-assignment-20261119 test/analysis/touchid-3512/jpda-comparison/optimized/original-vs-optimized/linear/process-1
dotnet run --no-build -c Release --project test/touchid-analysis/TouchIdAnalysis.csproj -- --compare-jpda-optimization /tmp/reflex-assignment-20261119 test/analysis/touchid-3512/jpda-comparison/optimized/original-vs-optimized/kalman/process-1 --kalman
dotnet run --no-build -c Release --project test/touchid-analysis/TouchIdAnalysis.csproj -- --compare-jpda-optimization /tmp/reflex-assignment-20261119 test/analysis/touchid-3512/jpda-comparison/optimized/original-vs-optimized/linear/process-2
dotnet run --no-build -c Release --project test/touchid-analysis/TouchIdAnalysis.csproj -- --compare-jpda-optimization /tmp/reflex-assignment-20261119 test/analysis/touchid-3512/jpda-comparison/optimized/original-vs-optimized/kalman/process-2 --kalman
python3 test/touchid-analysis/verify_jpda_comparison.py /tmp/reflex-assignment-20261119 test/analysis/touchid-3512/jpda-comparison/optimized/original-vs-optimized --optimization
```

The same build supports `--compare-jpda` for a fresh global/optimized-JPDA control. Repeat the four
commands from the preceding section with output rooted at `jpda-comparison/optimized/global`,
then run the verifier on that root without `--optimization`. The recorded campaign order is
original/optimized linear P1, original/optimized Kalman P1, global/optimized linear P1,
global/optimized Kalman P1, then those four campaigns for P2. Run sequentially.

Both implementations use identically typed delegates bound once outside timing. Existing warm-up,
AB/BA, input, publication and motion-profile controls remain unchanged. Managed allocation counters
surround `Update` plus `GetVelocities` **outside** the stopwatch intervals; collection bookkeeping,
construction and quality inspection are excluded from that count.

For original/optimized comparisons, `recovery-controls.json` additionally records six deterministic
control scenarios: masked pair, moving crossing, six-way overlap, inclusive deadline, expired
deadline and JPDA disabled. Their complete raw/tracked output must match, with the expected ID
allocation counts. These controls are separate from real replay metrics. The verifier checks their
equality and requires zero differences in replay output, targets, reservations and pruning flags.

The original replay artifacts remain unchanged. See
[the optimization report](../analysis/touchid-3512/jpda-optimization.md) for the repeated measurements.
