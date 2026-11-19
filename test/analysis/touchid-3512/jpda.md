# Optional JPDA-based identity recovery

Implemented on `feature/jpda`, based on the tuned Kalman branch (`118e8c4a`).

## User-visible behavior

Enable **Settings → Smoothing → JPDA identity recovery** to attempt recovery of contact IDs
hidden by an overlapping pressure region. The default is **disabled**, including legacy settings
files that omit the new value.

When two contacts compete for one detected pressure point, the tracker continues publishing a
single measured ID, selected from the most probable complete one-to-one association event.
The competing unassigned ID can retain a bounded, unpublished recovery state. When separate
measurements become available again, both IDs participate in probabilistic association; the old
masked ID can therefore be recovered instead of necessarily allocating a new ID.

Example: two Push contacts with IDs 0 and 1 approach, the detector reports only their merged
pressure region, and ID 0 continues receiving the single measurement. After separation, compatible
motion forecasts and joint assignment can restore ID 1 to the reappearing region. This also works
after the ordinary Lost publication has disappeared and its raw frame-cache entries were evicted.
It does not reconstruct an identity from historical output frames.

## Association model

`JpdaContactAssignment` computes joint event weights and association/miss/birth marginals.
Every feasible event assigns each measurement to at most one existing track or to birth, and each
track to at most one measurement. Push and Pull never share an ID. The existing strict Manhattan
gate, prediction setting and selected motion model continue to define compatible pairs.

For event E:

```text
C(E) = sum(matched Manhattan distance / gate)
       + AssignmentMissCost × number of unmatched tracks
       + AssignmentBirthCost × number of births

w(E) = exp(-C(E) / T),             T = 0.15
P(E) = w(E) / sum(w(feasible events))
beta(measurement, track) = sum(P(E) for events containing that pair)
```

Normalization uses shifted log weights to avoid underflow in the denominator. The costs retain
their existing defaults, 0.5 each. These normalized Gibbs weights are an explicit association
model, not empirically calibrated detector or physical-identity probabilities. Kalman covariance
is not used as a Mahalanobis gate or likelihood in this implementation.

For a symmetric two-track/one-measurement ambiguity, both matching events receive approximately
half of the association mass, while impossible simultaneous use of the measurement is excluded.
The hard output selects one complete maximum-posterior event, with deterministic ordering of
candidate coordinates and TouchIds to resolve ties. It does not select independent per-contact
argmax values, which could assign the same measurement twice, or multiply independent birth
marginals, which could spuriously replace a continuing track with two new IDs.

**Scope of JPDA:** this is a discrete JPDA-based association/recovery variant with hard output,
not a conventional JPDA filter that averages all association-conditioned Gaussian states. Only
the selected actual measurements update the existing contact filters and real sample histories.
It does not retain a multi-frame tree of alternative labelled trajectories, rewrite previously
published IDs, or solve identity globally over time. This choice keeps separate contact outputs
and the application's existing measurement/confidence contract.

The probability construction follows the joint-event/marginal principle described by the
[Stone Soup JPDA documentation](https://stonesoup.readthedocs.io/en/latest/stonesoup.dataassociator.html).
Its Gaussian-mixture filter update is deliberately outside this discrete association variant.

## Masked identity lifecycle

An unassigned track qualifies for extended recovery when:

1. It was actually measured in the immediately preceding observation.
2. Its association probability for the winner's measurement is at least **20% of the winner's
   association probability** in the joint-event posterior. The comparison is relative, so a
   plausible six-way overlap is not rejected just because every marginal is below 0.2.

The recovery deadline is the last actual measurement's **completion time** plus
`max(ContactRetentionSeconds, 1 second)`. Completion time controls liveness; capture timestamps
still control motion prediction. Repeated merged observations do not extend an unassigned ID's
deadline. An ordinary missing contact with no competing measurement receives no extension.

- Publication still follows ordinary retention and confidence rules. A reserved ID is not a
  synthetic measurement or an additional visible touch after its ordinary Lost output expires.
- A compatible real measurement before or exactly at the deadline can recover the same ID as
  `Confirmed`, without incrementing the ID allocator. Recovery decays confidence through the
  gap and grants no confidence gain for the missing interval. Ordinary publication filtering can
  still suppress an initially low-confidence recovered output.
- Smoothing and Kalman correction consume only the new real measurement at its actual timestamp.
  No missed frame, timer call or probabilistic alternative becomes a filter correction.
- After the deadline, the identity is permanently removed; later detections receive a new ID.
- Sensor/processing silence beyond `ObservationTimeoutSeconds` invalidates reservations, including
  when the next successful observation arrives without intervening timer publication.
- Disabling JPDA clears recovery reservations while preserving still-live contacts. Reapplying
  the same enabled setting is a no-op. Reset or disabling history clears all contact state.
- Histories and JPDA recovery state are runtime data; only the enable/disable setting is persisted.

Compared with ordinary tracking, this intentionally allows an ID to reappear after absence from
published output, within the bounded masked-contact window. Consumers should interpret that as
recovery of the same hypothesized contact, not as a guarantee of physical identity.

## Bounded computation and precedence

JPDA takes precedence over `UseMinimumCostAssignment` while enabled. Disabling JPDA restores
the saved global/greedy selection. Kalman filtering and velocity prediction remain independent:
without prediction, association uses the last available position; with prediction, it uses the
existing polynomial or Kalman forecast. Both existing miss/birth costs also apply to JPDA.

The candidate cap remains 20. Disconnected components in the candidate/track validation graph
are evaluated separately; this factorization is exact. Within each connected component, at most
**256 partial joint events** are retained after each measurement. Small components are exact;
larger ones use deterministic beam pruning. Their marginals are approximate and describe only
the retained events, so neither exact posterior probabilities nor global MAP optimality is claimed
after pruning. The approximation flag is available internally for regression tests.

At more than **64 retained track targets**, processing falls back to the saved ordinary assignment
strategy. That observation creates no new JPDA reservations; any existing reservations retain
their original bounded deadlines. This also bounds the bitset used for joint-event exclusivity.
History size zero bypasses JPDA and retains the existing fresh-ID-per-observation behavior.

## Settings and API

- C# / stored JSON: `TrackingServerAppSettings.UseJpda`, default `false`.
- Frontend / API settings JSON: `useJpda`, default `false` for omitted legacy fields.
- `GET /api/Settings/UseJpda`: returns the current JSON boolean.
- `POST /api/Settings/UseJpda`: accepts a JSON boolean, applies it to the current observer and
  persists it through the standard configuration/backup path.
- Full settings save/import, startup loading, observer replacement, backup/restore and reset
  include the setting. Application of observer settings uses the existing tracking lock.

The switch does not require Kalman filtering, and enabling it does not change the saved
global/greedy strategy or miss/birth settings.

## Validation and limitations

Regression coverage includes independently enumerated joint-event probabilities, normalized
association/miss/birth marginals, one-to-one output, pressure-type and spatial gating, dense
beam pruning, masked-ID recovery after publication/cache expiry, moving crossings with and
without Kalman, ordinary disappearance, bounded expiry, reset/history/toggle cleanup, and
sensor timeout with and without timer calls. Settings tests cover both serializers, legacy
defaults, persistence, startup, observer replacement, full save/import, backup/reset, frontend
controls and boolean HTTP requests.

Fully symmetric crossings, prolonged occlusion beyond the deadline, detector classification errors,
rapid unpredicted reversals and approximate dense-group inference can still produce wrong IDs.
JPDA cannot recover information that the measurements do not contain. Preserving a hypothesis
also risks reusing its ID for a genuinely new nearby same-type touch within the recovery window.
No improvement on annotated real multi-finger trajectories or end-to-end throughput is claimed.

Validation on 19 November 2026:

- **349 InteractionTests passed**, including 19 JPDA association/lifecycle cases and three new
  JPDA settings serialization cases alongside the existing Kalman/assignment regressions.
- **17 server settings integration tests passed** on ARM64, including JPDA startup, persistence,
  observer replacement, full save/import, backup/restore and reset.
- **29 targeted frontend tests passed** for Settings and assignment HTTP contracts, including
  legacy/explicit JPDA switch states and both boolean submissions.
- Shared TypeScript types, TrackingServer frontend and the benchmark project built successfully.
  The TrackingServer assembly was built by the integration suite. Changed frontend files pass
  ESLint; `git diff --check` passes.

Reproduce the focused checks from the repository root with restored dependencies:

```sh
dotnet test test/Library/InteractionTests/InteractionTests.csproj -c Release --no-restore -m:1 -nr:false -p:UseSharedCompilation=false
dotnet test test/Server/SettingsTests/SettingsTests.csproj -c Release --no-restore -m:1 -nr:false -p:UseSharedCompilation=false -p:Platform=ARM64
npm run build:shared-types
npm run test-ci -w tools/ReFlex.TrackingServer/ClientApp -- --include='**/settings.component.spec.ts' --include='**/settingsService.assignment.spec.ts'
npm run build:server
```

The server test's ARM64 platform selection is specific to the validation host; choose the native
target on other systems. Historical benchmark observers expose the new boolean for interface
compatibility but retain their historical algorithm; their runtime is not a JPDA benchmark.
