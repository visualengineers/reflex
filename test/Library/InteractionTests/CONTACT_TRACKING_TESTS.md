# Contact tracking regression tests

## Contract

Each update carries a strictly increasing monotonic observation timestamp in seconds.
Lifecycle and confidence decay use elapsed time. Frame IDs only order snapshots, and history
capacity/smoothing windows still count samples. Tests pass explicit timestamps; no sleeps.

| Parameter | Valid range | Zero behavior |
| --- | --- | --- |
| History capacity | `0 .. int.MaxValue` | Disable tracking/history |
| Smoothing samples | `0 .. history capacity` | Disable smoothing |
| Contact retention seconds | finite, `>= 0` | No bridging between distinct observation times |
| Depth scale | finite, `> 0` | Rejected |

## Lifecycle

- A first measurement creates a `Tentative` contact.
- A second associated measurement changes it to `Confirmed`.
- Missing measurements produce `Lost` outputs while `now - lastMeasurementTime <= ContactRetentionSeconds`.
  Their measurement timestamp stays unchanged; confidence decays with elapsed missing time.
  Raw history contains only measured contacts. Evicting that history does not end a live track.
- Returning at or before the deadline preserves the ID and produces `Confirmed` again.
- Expiry is checked **before assignment**, even if no intermediate frames were processed.
  After the deadline the track is removed permanently; increasing retention cannot resurrect it.
- Only an associated real measurement renews the deadline. A `Lost` output does not.
- Zero retention gives every later measurement a fresh ID. History size zero disables tracking.
- Expiry becomes visible on the next update; there is no background timer or terminal event.

With retention `.1`, a measurement at `10.0` may be reassociated at `10.1`, but a measurement
at `10.1001` starts a new ID. This holds at every frame rate and with any number of empty updates.

## Configuration migration

`ContactRetentionSeconds` replaces `MaxNumEmptyFramesBetween` throughout the runtime API and
frontend (`contactRetentionSeconds`). Default: `.1` seconds. Settings → Contact retention uses
seconds with `.01` steps, independently of cache capacity. Existing JSON configuration accepts
the old field for migration at a fixed reference rate of **30 Hz**: `3` becomes `.1`, `0` stays `0`.
This preserves the nominal hold duration, not the old extra recovery-frame allowance.
Explicit seconds win if both properties exist, regardless of order. Saving emits only seconds.
Invalid negative/non-finite durations are rejected. The control offers 0–2 seconds; the API
accepts any finite non-negative duration. A duration shorter than the observation interval
can intentionally cause new IDs even for continuously detected contacts.

`TrackingState` is an additive public property on `Interaction` (and therefore on serializers
that serialize public properties). No terminal sample/event is emitted: ending is represented
by absence from the next output. Existing confidence filtering remains separate from lifecycle
confirmation; tentative contacts are not automatically hidden by this new state.

## Assignment

With prediction disabled, pairs are ranked by distance to each track's **last measurement**, not its oldest cached
position. With prediction enabled, the target is its forecast at the current frame. Matching is greedy and one-to-one: a track and a measurement are each used at most
once. Unassigned measurements receive fresh IDs rather than being discarded. Equal-cost
pairs use track ID, candidate X/Y and input index as tie breakers. The existing strict distance
threshold and Manhattan-distance implementation of `Squared2DDistance` are unchanged.

Greedy assignment is not globally optimal. With prediction disabled, there is no motion model. Exact/ambiguous crossings
can exchange physical finger identities. The crossing test explicitly documents that limitation;
it tests distinct observations and proximity semantics, not impossible identity recovery from
identical position-only observations. The pre-existing 20-candidate cap also remains in place.

## Test organization and extensions

- `ContactLifetimeTest`: cadence invariance, exact deadline/recovery, dropped updates, cache eviction,
  renewal, zero retention and JSON migration/round trips.
- `ContactTrackingRegressionTest`: deterministic one-second observation sequences, competing candidates,
  latest-position matching, approaching/merging/separating contacts, crossing limitations,
  exact gap boundaries, independent lifetimes, reset, zero history and snapshot isolation.
- `TrackingConfigurationTest`: public parameter boundaries, constructor defaults, actual
  expiry behavior, history resizing, filter window rebuilding and invalid depth scales.
- `MultiInteractionAngleTest`: real detector-stage input with prescribed cosine similarities;
  checks equal axis weighting in both orientations without classifier dependencies.
- `Common.Test/InteractionsTest`: both copy constructors preserve metadata/point flags and
  deeply copy positions and extremum descriptions.
- `SmoothingBehaviourTest`: existing regression coverage. Its long-gap expectation now
  requires a new ID rather than resurrecting an expired one.

To add a trajectory case, create a `Scenario`, record IDs from its first `Step`, and express
movement as subsequent `Step(x1, x2, ...)` calls. `Step()` advances the synthetic clock by one second and inserts a missing observation. The
helper uses deterministic timestamps and no sleeps or randomness. Assert current observations
with `At(frame, x)`; it deliberately excludes held `Lost` points. For other coordinates/depths,
use `Scenario.Tracker.Update` with explicit `Interaction` instances. Keep each test focused on
one behavior and explain why its coordinates exercise the failure. Prefer parameterized tests
for boundary values and input-order permutations.

Snapshot tests exercise filter pass-through (too few samples) and an active moving-average
path. They assert immutable inputs/cache contents and correct depth scaling. Latest-window
selection, complete filter output and motion models are additionally covered by PositionPredictionTest.

Run from the repository root:

```sh
dotnet test test/Library/InteractionTests/InteractionTests.csproj
dotnet test test/Library/Common.Test/Common.Test.csproj
```
