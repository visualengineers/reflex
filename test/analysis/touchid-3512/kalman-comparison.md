# Replay comparison and tuning: linear motion prediction versus Kalman filtering

19 November 2026. This English report updates the initial comparison with parameter tuning and
repeated measurements. The optimized working tree is based on `0a19594c` on
`feature/##36-kalman-filter`; the original evaluation used production code from `95650caf`.

**Increasing the process spectral density q from 400 to 400,000 pixel²/s³ removes the observed
single-target identity regression.** Created tracks fall from **77 to 38 (−50.6%)**, and published
single-target ID changes fall from **25 to 0**. These aggregate counts now match linear prediction
on the available recordings. Kalman retains its tracking-stage runtime advantage.
Both new measurement processes reproduce identical quality metrics.

This is exploratory tuning on the same recordings used for evaluation, not independent validation.
Kalman remains optional and disabled by default. Matching aggregate counts does not establish
identical trajectories, greater physical accuracy or improved multi-finger identity tracking.

## Controlled comparison

Both modes use the current production `InteractionSmoothingBehaviour`. **Only `UseKalmanFilter`
changes within each comparison.** Global minimum-cost assignment, explicit miss/birth costs and
hard Push/Pull type separation stay enabled in both modes. The pressure-type policy therefore
cannot account for differences attributed to Kalman filtering.

| Mode | Motion prediction | Published XY smoothing |
| --- | --- | --- |
| `linear3` | existing linear fit of three actual measurements | existing moving average, three samples |
| `kalman` | recursive constant-velocity state | Kalman posterior |

The switch changes both prediction and XY smoothing. Raw assignment metrics additionally distinguish
association changes from publication effects. Depth retains the configured existing smoother.

The inputs are the four recordings and the pre-assignment captures already used for the
[greedy/global comparison](assignment-comparison.md):

| Recording | Directory under `wwwroot/recordings` | Frames | Measurements |
| --- | --- | ---: | ---: |
| Half-Circle | `2026-11-03_10-21-51` | 258 | 398 |
| Line | `2026-11-03_10-19-39` | 340 | 177 |
| Circle | `2026-11-03_10-17-09` | 229 | 229 |
| Multi-Touch | `2026-11-03_10-20-23` | 430 | 1363 |
| **Total** | | **1257** | **2167** |

All eight capture/reference SHA-256 hashes match the previous comparison. Only the original
pre-assignment `measurements`, including detector confidence, and independently decoded strongest
source-image deformations are reused. Historical assigned IDs and smoothed outputs are not inputs.
Detection and consolidation are not rerun separately for each motion model.

Shared configuration: nominal 30 Hz timestamps `100 + frame/30`, history 15, three-sample moving
average, depth scale 490, strict Manhattan assignment gate `< 81 px`, miss/birth costs 0.5 each,
publication cluster distance 58, confidence minimum 0 and maximum 30, confidence gain/decay 30/s,
contact retention 0.1 s and observation timeout 1 s. Captures used 3 px extremum consolidation.
Velocity prediction is enabled, polynomial acceleration disabled, and the diagnostic forecast
horizon is 0.05 s. Assignment predicts to the current observation time, without that extra horizon.

## Metric definitions and limits

- **Published target ID changes:** choose the published target closest to the strongest source-image
  deformation; count ID changes only across consecutive active-input frames with target output
  in both frames. Pauses or output gaps reset the comparison. For Half-Circle, exclude the stationary
  region within 60 px of (249,210).
- **Created tracks:** every internally allocated ID, including tentative, stationary,
  confidence-filtered and cluster-suppressed contacts. This does not count independently verified
  new physical touches.
- **Raw representative changes:** apply the same reference selection to assigned actual measurements,
  before smoothing, confidence filtering and publication clustering; require consecutive active
  input frames and target measurements in both frames.
- **Distinct published target IDs:** unique IDs in target output over the complete recording.
- **Active without output:** active source-image frames without a published target.
- **Multi-Touch:** physical finger trajectories are not annotated. The strongest region can move
  between fingers, so representative changes are diagnostics, not physical ID-switch counts.
  They are not added to the single-target total.

There is no independent ground truth. We do not infer positional RMSE, calibrated uncertainty
coverage or sensor accuracy. Even single-target changes are reproducible reference metrics rather
than manually annotated MOT identities. Confidence/output gaps can hide internal fragmentation.

## Parameter search and selection

The production Kalman model, assignment gate, costs, lifecycle and input data remain unchanged.
Only the noise constants were varied offline. The sweep compiled and ran the production tracker
for **24 combinations**:

- q = 400, 4,000, 40,000, 100,000, 200,000, 400,000, 1,000,000, 4,000,000 pixel²/s³;
- measurement variance R = 1, 4, 16 pixel²;
- initial velocity variance fixed at 10,000 (pixel/s)².

Every candidate ran all 1,257 frames with both Kalman and linear prediction. Candidate metadata
checks the actual compiled constants against the requested values. The
[complete search results](kalman-comparison/tuning/noise-grid.json) retain all combinations,
quality metrics, configuration and input/source hashes. The R = 4 slice is:

| q, pixel²/s³ (R = 4) | Created tracks, all recordings | Single-target published ID changes |
| ---: | ---: | ---: |
| 400 | 77 | 25 |
| 4,000 | 61 | 12 |
| 40,000 | 50 | 7 |
| 100,000 | 42 | 3 |
| 200,000 | 40 | 2 |
| 400,000 | 38 | 0 |
| 1,000,000 | 38 | 0 |
| 4,000,000 | 38 | 0 |

Selected production defaults:

| Parameter | Initial value | Tuned value |
| --- | ---: | ---: |
| Measurement variance R, pixel² | 4 | **4** |
| Acceleration spectral density q, pixel²/s³ | 400 | **400,000** |
| Initial velocity variance, (pixel/s)² | 10,000 | **10,000** |

R retains the existing 2 px measurement-standard-deviation assumption; no independent sensor
calibration justifies replacing it. Initial velocity uncertainty remains unchanged. At R = 4,
400,000 is the **smallest tested q** that restores 38 births and zero single-target published
changes. It is not a proven optimum over continuous parameter space.

At 30 Hz, the process contribution to predicted position variance, `q × dt³ / 3`, rises from
0.00494 to 4.94 pixel² per step. This permits the velocity estimate to respond more quickly to
turns instead of retaining an excessively smooth motion state. q is a continuous white-noise
acceleration spectral density, not a fitted constant acceleration or a direct acceleration variance.
No gate widening, relaxed pressure constraint or special recording-specific tracking rule was added.

Larger q values do not improve the single-target ID counts in this grid and trade away more noise
attenuation. They can change Multi-Touch representative counts, but those unannotated counts do not
establish better finger identities and were not used to choose a more aggressive parameter.

### Controlled regression checks

Eight new cases cover a 900 px/s trajectory with abrupt reversals and a radius-110 px circle at
10 rad/s, both with ±1 px XY noise, at 30 and 60 Hz, under global and greedy assignment. These
synthetic trajectories are separate from the replay samples. All eight fail with the original
q = 400 due to identity fragmentation and pass with q = 400,000, retaining exactly one ID.

The existing controlled constant-motion test with alternating ±2 px measurement noise still passes:
filtered/raw squared-error ratio **0.407171**, approximately **59.3% less squared position error**
than raw input. This demonstrates retained smoothing for that specific test signal, not general
sensor accuracy. The original lower q smoothed more strongly; improved responsiveness has a
smoothing trade-off. The independent analytic Kalman-correction expectation was updated for q.

All **327 InteractionTests** pass, including covariance growth, read-only prediction, irregular
sampling, live toggles, gaps, type separation and existing assignment/lifecycle regressions.
[Regression evidence](kalman-comparison/tuning/regressions.json) preserves test counts, the eight
before/after outcomes, controlled noise output and relevant source hashes.

## Identity and track-birth results

Cells show **linear prediction → initial Kalman (q = 400) → tuned Kalman (q = 400,000)**.
Initial and tuned quality results are each identical across their two measurement processes.

| Recording | Published target ID changes | Created tracks | Distinct published target IDs | Active frames without target output |
| --- | ---: | ---: | ---: | ---: |
| Half-Circle | 0 → 2 → 0 | 4 → 6 → 4 | 3 → 5 → 3 | 10 → 10 → 10 |
| Line | 0 → 5 → 0 | 9 → 14 → 9 | 7 → 12 → 7 | 25 → 25 → 25 |
| Circle | 0 → 18 → 0 | 1 → 22 → 1 | 1 → 18 → 1 | 1 → 1 → 1 |
| Multi-Touch | not annotated | 24 → 35 → 24 | 10 → 17 → 11 | 4 → 4 → 4 |

Active source-image frames are 154 / 198 / 229 / 407. Missing-output counts stay unchanged;
this alone would not prove identity stability.

| Recording | Raw representative changes | Published representative changes |
| --- | ---: | ---: |
| Half-Circle | 0 → 2 → 0 | 0 → 2 → 0 |
| Line | 3 → 8 → 3 | 0 → 5 → 0 |
| Circle | 0 → 21 → 0 | 0 → 18 → 0 |
| Multi-Touch | 5 → 6 → 4 | 3 → 7 → 4 |

Tuning therefore also removes the additional single-target association changes before publication.
Line still has three raw representative changes in both linear and tuned Kalman modes, although
its published-change metric is zero. For Multi-Touch, tuned Kalman publishes 11 distinct target IDs
versus 10 for linear prediction and changes representative four versus three times. Its trajectories
and publication choices remain different; equal births do not imply equal physical identities.

### Gate failure analysis: Circle

Circle has one measurement in every frame, with the same pressure type throughout. Linear prediction
keeps one ID for all 229 frames. Initial Kalman produces 22 IDs. All 21 raw changes create a new ID
while the previous same-type track is Lost; its forecast residual lies outside the unchanged gate:
**81.50–137.84 px**, compared with the strict limit `< 81 px`.

At the first failure, zero-based frame **49**, the measurement is `(312.66, 267.68)` and the old
Kalman matching target is `(363.44, 222.28)`: Manhattan residual **96.18 px**. The preceding actual
measurement was `(330, 250)`, only **35.02 px** away. This is a forecast-induced gate rejection,
not a missing detection, pressure-type change or immediate raw measurement jump beyond the gate.
The old [association-change trace](kalman-comparison/process-1/association-changes.csv) preserves
all failure coordinates and timestamps. Consecutive births initialized with zero velocity can
further propagate fragmentation after an initial failure.

With tuned q, frame 49 matches ID 0 at forecast `(325.78, 270.10)`, residual **15.55 px**.
The largest Circle matching residual over the tuned replay is **78.31 px**; all subsequent
measurements stay associated to ID 0, with **no additional births or raw/published ID changes**.
The [tuned frame trace](kalman-comparison/tuned/process-1/frames.csv) retains matching targets
and distances; a newly born track's self-position is not a prior forecast (`raw_is_birth=true`).
The remaining margin to the gate is limited, so this is evidence for these inputs, not a universal
fast-motion guarantee.

## Repeated runtime comparison

Release build, .NET SDK 10.0.403 / runtime 10.0.14, macOS 27.2.1, Arm64, eight logical processors.
For each recording and process: ten complete warm-up replays per mode, followed by 31 measured
replays in alternating AB/BA order, resetting the tracker for every replay. Two new processes run
sequentially, with **77,934 timed frames per mode** across both. No concurrent analysis builds or
tests, forced garbage collections or isolation from other operating-system activity were used.

Separate Stopwatch intervals measure `Tracker.Update` and the following `GetVelocities`, which
provides Processing-view motion diagnostics. Combined time is their sum **per frame**, not the
sum of separately computed quantiles. Median and p95 pool all frames from the 31 repetitions;
p95 uses rank `ceil(n × 0.95)`. Birth and empty frames are included.

**Tracker.Update only, microseconds/frame; tuned comparison:**

| Recording | Linear P1 median / p95 | Kalman P1 median / p95 | Linear P2 median / p95 | Kalman P2 median / p95 |
| --- | ---: | ---: | ---: | ---: |
| Half-Circle | 46.00 / 95.17 | 8.67 / 15.92 | 51.50 / 126.96 | 12.29 / 15.83 |
| Line | 10.54 / 31.75 | 1.08 / 1.88 | 10.58 / 30.79 | 1.38 / 3.96 |
| Circle | 15.04 / 29.67 | 1.25 / 1.54 | 14.83 / 30.04 | 1.29 / 1.50 |
| Multi-Touch | 44.04 / 176.92 | 2.71 / 7.79 | 42.46 / 154.00 | 2.75 / 8.00 |

**Tracker.Update plus GetVelocities, microseconds/frame; tuned comparison:**

| Recording | Linear P1 median / p95 | Kalman P1 median / p95 | Linear P2 median / p95 | Kalman P2 median / p95 |
| --- | ---: | ---: | ---: | ---: |
| Half-Circle | 87.58 / 190.21 | 9.21 / 17.46 | 92.00 / 262.62 | 13.54 / 17.33 |
| Line | 21.79 / 65.71 | 1.21 / 2.00 | 21.50 / 62.83 | 1.58 / 4.38 |
| Circle | 28.96 / 56.29 | 1.38 / 1.67 | 28.67 / 57.25 | 1.38 / 1.62 |
| Multi-Touch | 86.25 / 410.71 | 3.00 / 8.83 | 83.17 / 344.04 | 3.08 / 9.04 |

Full separate update/diagnostic quantiles and per-replay totals are retained in the result files.
The repeated comparison confirms the Kalman runtime advantage over the paired linear control.
The initial evaluation also showed faster Kalman computation despite poor identity stability;
its original runtime results remain preserved. Absolute times across campaigns should not be used
to attribute an additional performance improvement to q, because machine/JIT/background conditions
vary. Parameter tuning is an identity-responsiveness change, not a new computational optimization.

The runtime difference is consistent with the implementation: `ContactMotion.Estimate` recomputes
polynomial fits for X/Y/Z for association and motion diagnostics, while Kalman maintains a small
persistent XY state. Modes can also have different association histories. This measures the switch
on actual replays, not arithmetic with artificially identical track states.

Excluded: JSON parsing, tracker construction, JPEG decoding, sensor filtering, extremum detection,
consolidation, reference metrics, publication clustering, calibration, uncertainty-contour generation,
Angular rendering, networking and server timers. These are **tracking-stage times, not end-to-end
latency or FPS**. Nominal observation timestamps prevent execution speed from changing expiry times.

## Recommendation and reproducibility

The selected defaults remove the observed single-target regression while retaining the runtime
advantage and measurable controlled noise attenuation. Keep Kalman opt-in until separate annotated
recordings validate the tuning across speeds, overlap, detection gaps and sensor noise. Physical
uncertainty coverage remains uncalibrated. Covariance-based gating remains a separate possible
extension rather than part of this parameter change.

- [Comparison implementation](../../touchid-analysis/MotionComparison.cs),
  [offline tuning script](../../touchid-analysis/tune_kalman.py) and
  [commands and timing scope](../../touchid-analysis/README.md#paired-linear-predictionkalman-comparison).
- Tuned process 1: [results/provenance](kalman-comparison/tuned/process-1/results.json),
  [frames](kalman-comparison/tuned/process-1/frames.csv),
  [association changes](kalman-comparison/tuned/process-1/association-changes.csv),
  [timing replays](kalman-comparison/tuned/process-1/timing-replays.csv),
  [tracks](kalman-comparison/tuned/process-1/tracks.json).
- Tuned process 2: [results/provenance](kalman-comparison/tuned/process-2/results.json),
  [frames](kalman-comparison/tuned/process-2/frames.csv),
  [association changes](kalman-comparison/tuned/process-2/association-changes.csv),
  [timing replays](kalman-comparison/tuned/process-2/timing-replays.csv),
  [tracks](kalman-comparison/tuned/process-2/tracks.json).
- Original process 1: [results/provenance](kalman-comparison/process-1/results.json),
  [frames](kalman-comparison/process-1/frames.csv),
  [association changes](kalman-comparison/process-1/association-changes.csv),
  [timing replays](kalman-comparison/process-1/timing-replays.csv),
  [tracks](kalman-comparison/process-1/tracks.json).
- Original process 2: [results/provenance](kalman-comparison/process-2/results.json),
  [frames](kalman-comparison/process-2/frames.csv),
  [association changes](kalman-comparison/process-2/association-changes.csv),
  [timing replays](kalman-comparison/process-2/timing-replays.csv),
  [tracks](kalman-comparison/process-2/tracks.json).

Each result includes input/source SHA-256 hashes, complete defaults, explicit overrides, compiled
Kalman constants, runtime information and warm-up/repetition counts. Existing temporary captures
were reused from `/tmp/reflex-assignment-20261119`; README commands regenerate captures from the
available JPEG recordings. Hashes distinguish exact reuse from new preprocessing.

Release builds and both full tuned comparisons completed successfully. Runtime invariants check
frame/time alignment, finite output/covariance and consistent allocated-ID counts in every timed
replay. Independent reconstruction from saved tracks/reference images checks ID changes, births,
missing outputs, distinct target IDs, process agreement and artifact/source hashes.
