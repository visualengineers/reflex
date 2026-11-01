# Position prediction: integration of PR #1233

Source: `feature/#412_velocity-based-prediction`, commit
`454e46c4db043ebe624f362c9ec1c34d35bcf1ad` ([PR #1233](https://github.com/visualengineers/reflex/pull/1233)).
The merge retains the current observer pipeline, calibration API and Angular architecture.
Existing interaction events keep their public signatures. Prediction diagnostics are additive.

## Assessment of the original implementation

| Finding | Integrated correction |
| --- | --- |
| `old - current` points backwards; no division by elapsed samples | Fit measured positions against processed frame IDs, centered at the newest measurement |
| Acceleration forecast averages velocity and acceleration | `p + v h + weight a h²`; weight `.5` models constant acceleration |
| `InteractionVelocity.Update` leaves derivative properties stale | Refresh derivatives and clone mutable points on every update |
| First contact without enough history breaks the whole loop | Each contact gets its own warm-up/fallback and diagnostic sample |
| Predicted synthetic frame is appended but oldest positions are searched first | One forecast per live track for the current frame is the primary matching target |
| Velocity validation computes a discarded list and compares signed ratios | Remove dead validation; use a bounded measured-sample fit and the existing spatial gate |
| History cleanup compares frame IDs to touch IDs and deletes nearby tracks across frames | Preserve measured history; explicit track expiry and one-to-one assignment own lifecycle |
| Smoothing takes oldest samples and first filtered output | Latest sample window, final output, filter window follows smoothing configuration |
| Moving-average output stops before the latest sample; Butterworth has a trailing zero | Correct causal moving averages and a causal Butterworth implementation with valid normalized cutoff |
| Frontend combines independently arriving interactions and velocities, transforms derivatives as positions and depends on measured DOM size | Atomic diagnostic snapshots, raw raster SVG `viewBox`, no calibration/DOM scaling of vectors |
| UI lacks a clear distinction between current assignment and next forecast | Measured, smoothed, matching target and both forecasts have different shapes/colors, legends, IDs and numeric values |

The original unrelated calibration API changes, benchmark rewrites and whitespace changes
are not needed for raster-space diagnostics and are not carried into the current architecture.
The original unused destructive velocity/history-cleanup options are not exposed as settings.

## Mathematical and temporal contract

- Time is **processed-frame index**, not milliseconds or sensor capture time. X/Y velocity
  is pixels/frame; Z velocity is normalized depth/frame. Acceleration is units/frame².
- Fit the last `NumFramesForPrediction` real measurements (default 3), retaining their frame
  IDs. Missing frames create a gap in the independent variable, not a fabricated measurement.
- With two samples, use linear motion. With acceleration enabled and at least three samples,
  use a quadratic least-squares fit. Center time at the latest measurement, so coefficient 1
  is current velocity and twice coefficient 2 is acceleration at that measurement.
- Anchor extrapolation at the latest raw measured position. Smoothed output never feeds back
  into the fit or matching. Smoothing may legitimately lag, and the visualization shows it.
- Match at `h = currentFrame - lastMeasuredFrame`; publish diagnostics for
  `h = currentFrame + 1 - lastMeasuredFrame`. This avoids a one-frame offset, including gaps.
- Each ID and candidate can be assigned once. Ended tracks never participate again. With
  prediction disabled or fewer than two samples, use the last measured position.
- New and Lost lifecycle behavior from `CONTACT_TRACKING_TESTS.md` remains intact. Lost
  points keep the last measurement time; predictions are separate diagnostic fields.
- Preserve the existing Manhattan distance gate despite its historical `Squared2DDistance`
  name. Greedy association is not a globally optimal assignment. Identical observations,
  abrupt changes after occlusion and motion outside the gate remain intrinsically ambiguous.
- Variable sensor cadence/skipped processing is not wall-clock compensated. A future timestamp
  model needs a consistent capture-time contract; `Interaction.Time` currently comes from object
  creation and is not reliable enough to silently reinterpret as sensor time.

`SecondDerivationMagnitude` accepts finite values in [0,1]. Prediction sample count is limited
by history size (minimum 2 where history allows it). History 0 disables tracking. Parameter
application configures history before its dependent windows, also when observers are replaced.

## Frontend and server

Processing → **Show prediction diagnostics** opens a separately subscribed panel. Settings
can enable/disable prediction, choose measured sample count, enable acceleration and set its
weight. **Apply and save prediction** updates both the active observer and persistent settings.

The `velocities` SignalR stream contains atomic `InteractionVelocity` snapshots with raster
width/height, current/target frame IDs, last measured frame, measured/smoothed/matching positions,
derivatives and both forecasts. No asynchronous join with the calibrated interaction stream is
required. Streams are released on panel close, component destruction and hub disconnect.

The responsive SVG keeps raster geometry consistent when resized. Layer toggles distinguish
linear and acceleration forecasts. Trails only append actual measurements, retain at most 20
points, and disappear when tracks end. Lost tracks are labeled and dashed. A table exposes exact
X/Y values and the selected model. No data/disabled prediction has an explicit empty state.

## Verification and extension

`PositionPredictionTest` uses analytic trajectories instead of recorded/random data:

- stationary and positive/negative constant velocity;
- constant acceleration, linear warm-up, unequal measurement intervals;
- prediction across missing frames without synthetic fit samples;
- crossing contacts with reversed input order and matching outside the old-position gate;
- independent multi-contact warm-up, expiry, reset, prediction disabled;
- latest smoothing window, all filter endpoints, unchanged raw history;
- owned diagnostic values and refreshed derivatives.

`ObserverPipelineTest` verifies publication, matching frame IDs and sensor dimensions.
`ExtremumClassificationTest` verifies settings survive observer replacement and that smoothing
still respects extremum classification. Frontend browser tests cover geometry, resize behavior,
input immutability, lost/expired trails, layer toggles, lazy subscriptions and saved settings.
The UI was also inspected at desktop and narrow widths with explicitly synthetic diagnostic data;
no live-camera accuracy is implied by that visual review.

To extend: choose an analytic p(t), feed one frame per step (including empty steps), then assert
both identity and the numeric forecast. Distinguish the target for this frame from the next-frame
forecast. Keep shape/render tests separate from transport/configuration tests.
