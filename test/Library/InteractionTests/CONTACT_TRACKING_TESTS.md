# Contact tracking regression tests

## Contract

One call to `InteractionSmoothingBehaviour.Update` represents one **processed frame**.
Empty input is a processed frame without detections. Skipped observer updates do not
advance this clock. Sensor timestamps and velocity prediction are not part of this tracker.

Configuration is clamped identically at the observer and standalone tracker:

| Setting | Effective range | Meaning of zero |
| --- | --- | --- |
| History size | `0 .. int.MaxValue` | Publish measurements with fresh IDs each frame; retain no history |
| Smoothing samples | `0 .. history size` | Disable position smoothing |
| Maximum empty frames | `0 .. max(0, history size - 1)` | End a contact on its first missing frame |

Getters return effective values. Reducing history reclamps dependent settings and rebuilds
the selected filter's window; increasing history does not restore previously clamped values.
Set history before dependent settings when applying a configuration. Depth scale must be
finite and positive to make scaling reversible.

## Lifecycle

- A first measurement creates a `Tentative` contact.
- A second associated measurement changes it to `Confirmed`.
- Missing measurements produce `Lost` outputs for up to `MaxNumEmptyFramesBetween` frames.
  They retain the last measurement timestamp and confidence; consumers must not interpret
  them as new sensor observations. Raw history contains only measured contacts.
- Returning within this limit preserves the ID and produces `Confirmed` again.
- On the first missing frame beyond the limit, the contact ends and is omitted from output.
  Its track is removed permanently. Old measurements may remain in the smoothing cache,
  but cannot resurrect it, even if the gap limit is subsequently increased.

For a limit of 2, `measured, empty, empty, measured` keeps the ID, whereas
`measured, empty, empty, empty, measured` creates a new ID.
`TrackingState` is an additive public property on `Interaction` (and therefore on serializers
that serialize public properties). No terminal sample/event is emitted: ending is represented
by absence from the next output. Existing confidence filtering remains separate from lifecycle
confirmation; tentative contacts are not automatically hidden by this new state.

## Assignment

Pairs are ranked by distance to each track's **last measurement**, not its oldest cached
position. Matching is greedy and one-to-one: a track and a measurement are each used at most
once. Unassigned measurements receive fresh IDs rather than being discarded. Equal-cost
pairs use track ID, candidate X/Y and input index as tie breakers. The existing strict distance
threshold and Manhattan-distance implementation of `Squared2DDistance` are unchanged.

This is not a globally optimal assignment or a motion predictor. Exact/ambiguous crossings
can exchange physical finger identities. The crossing test explicitly documents that limitation;
it tests distinct observations and proximity semantics, not impossible identity recovery from
identical position-only observations. The pre-existing 20-candidate cap also remains in place.

## Test organization and extensions

- `ContactTrackingRegressionTest`: deterministic frame sequences, competing candidates,
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
movement as subsequent `Step(x1, x2, ...)` calls. `Step()` inserts one missing frame. The
helper uses deterministic timestamps and no sleeps or randomness. Assert current observations
with `At(frame, x)`; it deliberately excludes held `Lost` points. For other coordinates/depths,
use `Scenario.Tracker.Update` with explicit `Interaction` instances. Keep each test focused on
one behavior and explain why its coordinates exercise the failure. Prefer parameterized tests
for boundary values and input-order permutations.

Snapshot tests exercise both filter pass-through (too few samples) and an active moving-average
path. They assert immutable inputs/cache contents and correct depth scaling, not the unrelated
known temporal-window and filter-mathematics issues. Those remain separate work.

Run from the repository root:

```sh
dotnet test test/Library/InteractionTests/InteractionTests.csproj
dotnet test test/Library/Common.Test/Common.Test.csproj
```
