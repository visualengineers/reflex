# Optional Kalman filtering and pressure-type invariance

Implemented on `feature/##36-kalman-filter`, branched from `d7d6bd4a`.

## Relationship to the original proposals

1. Global per-observation assignment is already implemented and remains independently switchable.
2. This branch adds a recursive Kalman motion model and XY position filtering. It retains the
   existing Manhattan gate and assignment costs; it does not introduce statistical association costs.
3. Multi-frame association hypotheses remain deferred. The Kalman state estimates one motion
   trajectory per track; it does not retain alternative identity assignments.
4. Extremum consolidation was initially proposed during diagnosis and subsequently implemented
   by `ExtremumConsolidator`. It already combines nearby classified extrema before ID assignment
   and before the measurement cap. This branch keeps it unchanged. Consolidation and assignment
   address different problems: redundant detections of one pressure region versus assigning current
   measurements to existing contacts. See [implementation.md](implementation.md) for its replay results.

## Switch, persistence and API

`TrackingServerAppSettings.UseKalmanFilter` defaults to **false**. Its API/TypeScript field is
`useKalmanFilter`. Missing legacy values mean false; explicit true/false round-trip through JSON,
full settings saves/imports, startup application, configuration backups, restore and reset.

- `GET /api/Settings/UseKalmanFilter` returns a JSON boolean.
- `POST /api/Settings/UseKalmanFilter` accepts a JSON boolean, applies it immediately and persists it
  using the existing configuration/backup mechanism.
- Settings → **Smoothing → Kalman filter** exposes the switch.
- Managers pass the setting to current and replacement observers. Observer configuration is
  synchronized with tracking updates using the existing tracking lock.

Enabling seeds each live filter from the track's retained, actual timestamped measurements.
Reapplying the same setting is a no-op. Disabling discards Kalman state and returns to the existing
filter/polynomial behavior. Neither toggle resets IDs, confidence, observation clocks or raw history.
The retained bootstrap window can be shorter than the track's whole lifetime; old discarded
measurements are not reconstructed.

## Model and numerical update

Each track owns two independent constant-velocity states, one per raster axis:

```text
state = [position, velocity]               units: [pixel, pixel/second]
F(dt) = [[1, dt], [0, 1]]
H = [1, 0]
Q(dt) = q * [[dt³/3, dt²/2], [dt²/2, dt]]
R = 4 pixel²
q = 400000 pixel²/second³
P(initial) = diag(4 pixel², 10000 (pixel/second)²)
```

Initialization uses the first real XY position and zero velocity. The covariance permits later
measurements to establish motion. Each associated real measurement first predicts through its
actual elapsed observation time, then corrects position, velocity and covariance. The update uses
double precision and the Joseph covariance form `(I-KH) P (I-KH)' + K R K'`.

`R` corresponds to an initial measurement standard deviation of 2 px. The process spectral density
permits velocity changes; it is not a fitted acceleration term. Initially `q` was 400; the subsequent
[replay tuning](kalman-comparison.md) increased it to 400000 to avoid lag-induced identity splits
during fast turns. R and initial velocity variance remain unchanged. These are implementation
defaults, not sensor-calibrated uncertainty estimates, and currently have no separate UI or persisted
noise controls. Tuning on the available recordings does not establish accuracy on unseen sensor data.

Forecast queries do not mutate the filter. Empty observations, Lost publication and timer ticks
never become corrections, samples or confirmations. State expires with the existing track and is
removed by reset/history disable. Non-finite XY measurements are ignored while Kalman filtering
is enabled. The 20-input cap retains its existing position before this validation.

## Integration with prediction, smoothing and diagnostics

- **Association:** both global and greedy assignment use the Kalman target position while enabled.
  `UseVelocityPrediction` (tracker: `UseVelocityForMapping`) still controls extrapolation. If true,
  the target is predicted to the current observation time. If false, it is the latest posterior XY
  estimate without advancing the position to that time.
- **Published measured position:** posterior XY replaces the configured smoother's XY result,
  even if the ordinary smoothing window is zero. Z keeps the selected existing depth smoother;
  the Kalman model does not estimate pressure magnitude or depth velocity.
- **Lost output:** continues to hold the last published smoothed position. Predictions are used
  for association/diagnostics, not to invent moving touch outputs during an observation gap.
- **Raw measurements and history:** remain unchanged copies of actual detector data.
- **Diagnostics:** preserve `MeasuredPosition` as the raw measurement and `SmoothedPosition` as
  the published result. Forecasts use the Kalman posterior and estimated velocity. The additive
  `InteractionVelocity.UseKalmanFilter` flag identifies this model. Acceleration is zero and
  `UseSecondDerivation` is false for these diagnostic snapshots. Both diagnostic forecasts coincide.
  The stored acceleration configuration is retained for use after disabling Kalman.
- **Sample count:** counts actual corrections since initialization, including retained measurements
  used at activation. `NumFramesForPrediction` controls the existing polynomial model, not the
  recursive Kalman state. Motion diagnostics are now emitted when either Kalman filtering or velocity prediction is active,
  so Kalman uncertainty remains visible without activating prediction-based association.
- **Assignment strategy:** `UseMinimumCostAssignment` remains independent. Costs, distance limits,
  retention and confidence are unchanged. Kalman covariance currently determines the state update,
  not pair costs, missing/new-track costs or the spatial assignment gate.

## Pressure type is a hard identity constraint

**Application assumption:** for this physical installation, one continuing contact cannot change
between Push and Pull. A track's `InteractionType` is therefore fixed for its whole lifetime.
Both assignment algorithms reject pairs whose pressure types differ. This rule applies regardless
of whether Kalman filtering is enabled.

An opposite-type detection at the same coordinates creates a new tentative ID. The previous track
may remain Lost until its ordinary deadline; a same-type detection may recover it within that
lifetime. A type-classification error therefore splits identity rather than changing a live contact's
type. This deliberately replaces the earlier contract that allowed type transitions within one ID.
The smoothing regression was updated to assert separate correctly signed outputs instead of a
within-ID type transition. No physical identity is inferred across a pressure-type boundary.

## Manhattan versus Euclidean distance

`Point3.Manhattan2DDistance(a,b)` now explicitly names the existing calculation `|dx| + |dy|`.
`Squared2DDistance` remains a compatible forwarding alias. Live assignment and publication clustering
use the new name; existing parameter values and threshold behavior remain unchanged.

There is no mathematical requirement to replace Manhattan distance just because Kalman filtering
is used. It remains a valid, inexpensive heuristic with a diamond-shaped acceptance region.
Its disadvantage for unconstrained XY motion is directional bias: at the same Euclidean displacement,
a diagonal move has up to √2 times the Manhattan distance of an axis-aligned move. For example,
(10,0) has L1=10, while (7,7) has L1=14 although their Euclidean distances are 10 and about 9.90.

Euclidean distance offers rotational invariance when XY have comparable scale and noise. A Euclidean
radius produces a circular gate and usually fits unconstrained isotropic motion more naturally.
Squared Euclidean distance avoids the square root for single-pair ordering or thresholding, but
summing squared distances changes the global objective compared with summing Euclidean distances.
Neither Euclidean version can silently replace the current metric: units/gate geometry, threshold
values, assignment-cost normalization and existing tuning must be migrated together.

For a Gaussian Kalman model, **Mahalanobis distance** is the more principled statistical extension:
it measures a residual against predicted innovation covariance, accounting for different uncertainty
in each direction and after a gap. With equal isotropic covariance it reduces to scaled Euclidean
distance. Introducing covariance-based gating/costs requires calibrated noise and explicit threshold
and birth/miss-cost semantics. It is distinct from the deferred multi-frame hypothesis work.

This branch consequently keeps L1 and corrects its name. It does not claim that L1 pair costs are
Gaussian likelihoods or that a Kalman predictor alone makes identity assignments optimal over time.

## Validation and scope

Deterministic regressions cover an independent analytic Kalman correction, irregular constant motion,
lower XY error for a controlled noisy trajectory, read-only forecasts and growing gap uncertainty,
held Lost output, recovery, real-only initialization, live toggles, prediction disable, history disable,
expiry/reset, non-finite input and hard type separation in both assignment strategies with Kalman on/off.
Server tests exercise legacy defaults, true/false persistence, startup, full save/import, observer
replacement, backup and reset. UI tests exercise default/explicit states and both boolean submissions.

Validation: 318 Tracking/InteractionTests, 16 server settings integration tests, 97 Common tests
and 23 targeted frontend tests passed. Shared TypeScript types and the TrackingServer frontend
built successfully; changed frontend files pass ESLint. The server assembly was built by the
integration suite.

The [Kalman/linear replay comparison and tuning](kalman-comparison.md) evaluates the implemented
switch on all four recordings. Initial defaults produced 77 tracks and 25 published single-target
ID changes, compared with 38 tracks and zero changes for linear prediction. Increasing q to 400000
restores 38 tracks and zero single-target changes, while retaining faster tracking-stage computation.
Kalman remains opt-in. Multi-Touch has no annotated physical finger identities; replay tuning is
exploratory and is not independent validation.

No real-sensor position-accuracy or full-pipeline performance improvement is claimed. The earlier
[greedy/global replay results](assignment-comparison.md) predate this Kalman branch and must not be
used as Kalman evaluation. Annotated trajectories and calibrated noise are needed for physical
accuracy claims, particularly during reversals, pressure-region overlap and detection gaps.

References:

- [Stone Soup Kalman tutorial](https://stonesoup.readthedocs.io/en/latest/auto_tutorials/01_KalmanFilterTutorial.html):
  position/velocity state, continuous white-noise acceleration covariance and predict/correct separation.
- [SciPy Manhattan distance](https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.distance.cityblock.html)
  and [Euclidean distance](https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.distance.euclidean.html).


## Processing visualization

The existing Interactions View in the Processing tab now contains a collapsible **Display Settings**
panel, following the point-cloud viewer's settings-panel pattern. **Show prediction** and **Show
Kalman filter** independently control rendering, without changing the tracking algorithm or persisted
settings. A switch is disabled when its corresponding algorithm is not active. The prediction layer
also offers matching, linear and acceleration sublayers; acceleration is inactive for the Kalman
constant-velocity model. The legend is owned by this viewer and includes only enabled overlays and
sublayers, plus the always-present interaction type markers.

The Kalman layer shows raw measurement markers, up to 60 real measurements and posterior estimates
per contact, the current estimate, and a translucent **95% joint XY Gaussian position contour**.
The contour uses `sqrt(chi-square(2, .95)) = sqrt(5.991464547)` times each axis's standard deviation.
It is model position uncertainty, not detector confidence or an empirically calibrated physical
accuracy bound. Ground truth is deliberately omitted: no independent live reference is available.

New additive diagnostic fields in `InteractionVelocity`:

- `UseVelocityPrediction`: identifies whether association extrapolation is active.
- `KalmanPosition`: posterior position at an observed frame, or read-only coasted position at the
  current diagnostic output time during a gap.
- `KalmanVarianceX` and `KalmanVarianceY`: position covariance diagonals in raw sensor pixel²
  at that same `TimestampSeconds`. They are null when Kalman filtering is absent.

The present model has independent XY axes and zero cross covariance. Thirty-two contour vertices
are generated in sensor coordinates and calibrated in the **same request** as the measured,
smoothed, matching and forecast positions. This preserves a common frame and correctly transports
the contour through rotation, scaling and perspective calibration rather than treating raw
variances as screen-axis variances. The original raw snapshot and variances remain unchanged.

Lost outputs can show a growing diagnostic contour and coasted estimate, but their measurement and
posterior trail histories are not extended. Published held touch positions remain unchanged. Duplicate
snapshots and resize do not create new samples; expired IDs and frame resets clear trail state.

With both overlays hidden, or processing stopped, the diagnostics subscription and pending calibration
are released and stale data is cleared. With either overlay visible, `exhaustMap` limits calibration
to one in-flight request and skips intervening snapshots rather than accumulating a queue. A Kalman
snapshot adds one center and 32 contour positions per track to the existing five calibrated positions;
this visualization work does not add measurements to the tracker. If covariance is missing/invalid,
no uncertainty contour or uncertainty legend entry is fabricated.

Tests cover covariance growth without prediction, calibrated contour vertices, invalid covariance,
independent display controls, initial/dynamic disabled states, selective legends, stream release,
bounded histories, duplicate/resize/coasting handling and frame resets. The shared checkbox now uses
native checked/disabled bindings, avoiding an Angular Forms initialization race for disabled controls.


Visualization validation: **319 Tracking/InteractionTests**, **55 Processing frontend tests** and
**12 shared-checkbox tests** passed. TrackingServer, shared Angular components/shared TypeScript
models and the normal frontend built successfully. Changed visualization files pass ESLint.
The rendered Angular layout was visually inspected with an isolated simulated measurement stream
processed by the production Kalman tracker. Temporary preview entry points were removed and the
localhost preview server stopped; no reference/demo mode or ground-truth fields were added to the app.
