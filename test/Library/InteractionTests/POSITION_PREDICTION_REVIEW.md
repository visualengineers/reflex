# Position prediction: PR #1233 integration and temporal model

Source: `feature/#412_velocity-based-prediction`, commit
`454e46c4db043ebe624f362c9ec1c34d35bcf1ad` ([PR #1233](https://github.com/visualengineers/reflex/pull/1233)).
The integration retains the current observer pipeline, calibration API and Angular architecture.
Existing interaction event signatures are preserved; prediction diagnostics are separate.

## Assessment and corrections

| Original problem | Current behavior |
| --- | --- |
| Backwards `old - current`, no elapsed-time normalization | Fit positions against monotonic measurement times; velocity in units/s |
| Acceleration forecast averages velocity and acceleration | `p + v h + weight a h²`; `.5` gives constant acceleration |
| Updating predictions leaves derivative properties stale | Refresh derivatives and deep-copy their mutable values |
| First contact without enough history breaks the loop | Independent warm-up/fallback per contact |
| Synthetic prediction is searched after oldest positions | Current-time forecast is the primary matching target |
| Discarded velocity-validation results and destructive history cleanup | Explicit track lifecycle and one-to-one assignment; no synthetic history samples |
| Oldest smoothing window and first filtered result | Latest measurements and final filter output |
| Incomplete moving-average output and trailing Butterworth zero | Complete causal averages and a time-aware continuous Butterworth model |
| Independently delivered interactions/velocities and incorrect coordinate transformations | Atomic diagnostic snapshots in a raster SVG viewBox |
| No confidence decay; past maximum restored on recovery | Independent live confidence, time-proportional decay, incremental recovery |

## Clock and units

`InteractionSmoothingBehaviour.Update(measurements, timestampSeconds)` accepts a finite,
strictly increasing monotonic timestamp in **seconds** for the whole observation frame.
Duplicate/reversed/non-finite times are rejected before tracking state changes. Reset starts
a new clock domain. The overload without a timestamp uses `Stopwatch.GetTimestamp/Frequency`.

`InteractionObserverBase` captures this monotonic time **before Analyze**, including before
remote analysis begins. RPC/computation duration therefore does not shift the timestamp to
response completion. The present point-cloud API does not carry sensor capture timestamps:
this is an observation/analysis-start timestamp, not a claim of sensor acquisition time.
Callers with reliable capture timestamps can supply them to the tracker; all times in a track
must belong to one clock domain. Do not mix sensor and host clocks without synchronization.

`InteractionFrame.TimestampSeconds` carries this time through cache snapshots. The legacy
`Interaction.Time` remains a wall-clock metadata field and is deliberately NOT the model clock.
Frame IDs identify/order frames but no longer determine velocity or forecast duration.

X/Y velocity is pixels/s, Z velocity is normalized depth/s, and acceleration is units/s².
The model fits the latest `NumFramesForPrediction` actual observations. Time is centered at
the last measurement and normalized to [-1,0] for numerical conditioning; derivatives are
converted back to seconds. Two samples give linear motion; at least three with acceleration
enabled give a quadratic least-squares fit. Smoothed positions never feed back into the fit.

Matching uses `h = current timestamp - last measured timestamp`. This handles both explicit
empty updates and frames omitted entirely between observations. Skipped work must not insert
fabricated measurements. Abrupt motion/long occlusions can still make extrapolation ambiguous;
association remains greedy with the existing Manhattan-distance gate.

The diagnostic horizon is explicit: `PredictionHorizonSeconds` (default .05, allowed [0,1]).
The target is `current timestamp + horizon`, NOT a presumed next frame. Lost tracks include
elapsed time since the last measurement as well as this horizon. Diagnostics expose current,
last-measured and target timestamps, the horizon, live confidence and actual sample count.
`PredictionFrameId` has been replaced by `PredictionTimestampSeconds`; consumers of the new
prediction diagnostic API must use the time fields.

## Temporal filters

`Base2DFilter.Process(points, timestampsSeconds)` validates the same one-time-per-sample,
finite/strictly-increasing contract, including during warm-up. It passes real relative time
spacing to fits (normalized for numerical stability). Polynomial filters evaluate at those
same time coordinates, rather than integer sample indices. The smoothing pipeline passes
actual cached measurement timestamps for its latest window; missing observations are omitted
without compressing the elapsed intervals.

Butterworth is a continuous second-order low-pass with a cutoff in **Hz** (default 3 Hz).
Its exact damped-state transition assumes linear input between samples and uses each actual
interval. It therefore has the same ramp response at different sampling cadences and stays
stable across long gaps. Warm-up is initialized at the first sample with zero derivative.

The original `Process(points)` overload is retained for untimed callers and explicitly assumes
30 Hz. It cannot infer real time from positions alone. The tracker always uses the timed overload.
Moving-average, weighted-moving-average and Savitzky–Golay filters are not Base2D subclasses;
they remain sample-window filters. They are not advertised as fixed-Hz filters for irregular data.

## Confidence and lifecycle

Live confidence belongs to the track, not to its immutable historical measurements.

- Birth clamps raw confidence to `[0, MaxConfidence]`.
- A successful association adds one confirmation, capped at MaxConfidence. Higher raw spatial
  confidence cannot restore a historical maximum.
- Missing observations decay confidence by `ConfidenceDecayPerSecond * elapsed seconds`
  (tracker default 30 units/s). Several short missing updates and one long missing update give
  the same decay for the same missing duration. The rate is nonnegative; zero disables decay.
- A returning lost contact first decays through the remaining lost interval, then gains one
  confirmation. Continuous successful observations do not decay merely because their cadence
  is slower. An omitted update alone cannot prove a missing detection.
- Confidence saturates at zero. Zero does not itself delete a track: the existing strict
  `Confidence > MinConfidence` publication filter hides it, and it can recover within its lifetime.
- Raw cached confidence is not rewritten by loss; output/diagnostic confidence reflects live state.

`ContactRetentionSeconds` defines the inclusive maximum age of the last real measurement.
Expiry is checked before matching, including dropped-update intervals, independently of cache
capacity. Default `.1` seconds; legacy JSON frame counts migrate at 30 Hz. Returning after
expiry creates a new ID with no inherited motion/confidence. See CONTACT_TRACKING_TESTS.md
for boundary, zero-duration and migration semantics.

## Frontend

Processing → Show prediction diagnostics exposes the model settings, including forecast
horizon in milliseconds. Apply/save converts ms to seconds for the server and persists it.
The atomic `velocities` stream contains measured, smoothed, matching and forecast positions,
sensor dimensions, timestamps, derivatives and confidence. Rendering needs no asynchronous
join or calibration transform. SVG geometry remains unchanged on viewport resize.

Legend/table explicitly distinguish current matching targets from the configured forecast
horizon. Velocity/acceleration labels show px/s and px/s²; the table shows measurement age in
milliseconds and current confidence. Lost tracks remain dashed/labeled; actual-only trails
are bounded to 20 samples and clear at expiry/reset. Empty data has an explanatory state.

## Tests and extension

`TemporalTrackingTest` adds deterministic, explicitly timed scenarios:

- equal analytic motion at different irregular cadences and a large clock origin;
- acceleration with unequal intervals, skipped frames and explicit empty frames;
- crossing identity after a longer interval;
- duplicate/reversed/non-finite times, reset and invalid horizon;
- time-equivalent confidence loss, lower bound and recovery without historical maxima;
- timed smoothing pipeline, polynomial evaluation at real timestamps, Butterworth cadence
  invariance/long-gap stability and invalid filter input/isolation.

`PositionPredictionTest` retains the original trajectory regression cases using explicit
one-second observations, not sleeps or machine speed. `ObserverPipelineTest` verifies diagnostic
times, units, dimensions and confidence-based hiding/recovery. `ExtremumClassificationTest`
verifies prediction settings survive observer changes. Browser tests cover ms/seconds conversion,
time labels, confidence/age, SVG geometry, lost trails, immutable input and panel subscriptions.

Extend with an analytic p(t): feed one observation per explicit timestamp, optionally omit
updates or insert empty observations, and assert identity, derivatives, target time and position.
Do not substitute frame number for time. Use tolerance appropriate to the float point storage.
