# Global contact assignment per observation

## Problem and alternatives

The original `MapClosestInteraction` ranked all allowed track/measurement pairs by distance,
then accepted each pair whose track and measurement were still free. These irrevocable greedy
decisions can fragment tracks even when a complete valid assignment exists.

With prediction disabled, existing contacts at x=0 and x=100, measurements at x=80 and x=120,
and the existing strict Manhattan-distance gate of 81:

| Track | Measurement 80 | Measurement 120 |
| --- | ---: | ---: |
| 0 | 80 | 120 (forbidden) |
| 100 | 20 | 20 |

Greedy selected 100→80 first, leaving track 0 missing and creating a new ID at 120.
The alternative 0→80, 100→120 preserves both IDs within the gate.

Possible approaches are complementary:

1. **Global assignment per observation:** optimize all track/measurement decisions together,
   explicitly including missed tracks and new contacts. This directly addresses the greedy
   limitation and is implemented below.
2. **Better costs and prediction:** include motion uncertainty, direction, depth/pressure history,
   detection quality or track state. A Kalman estimator could supply position and uncertainty;
   uncertainty-aware distances could replace a fixed spatial score. Such models require tuning
   against actual sensor data. Pressure type must not be made a hard constraint accidentally:
   existing tracking permits type transitions while preserving IDs.
3. **Temporal hypotheses:** retain alternative associations across observations, e.g. through
   multiple hypothesis tracking or probabilistic association such as JPDA. This can help at
   ambiguous crossings, at the expense of computation, more state and potentially delayed final
   identity decisions. Position-only observations cannot uniquely resolve identical trajectories.
4. **Measurement consolidation:** combine neighboring extrema of one physical contact before
   assignment. This is already implemented by `ExtremumConsolidator`; see
   [implementation.md](implementation.md). A one-to-one solver alone cannot identify duplicate
   extrema as one finger, and excessive consolidation can merge genuinely distinct fingers.

## Implemented objective

For a partial one-to-one matching M between live tracks and current measurements, minimize:

```text
sum(distance(track forecast, measurement) / TouchMergeDistance2D for pairs in M)
+ AssignmentMissCost  * number of unmatched live tracks
+ AssignmentBirthCost * number of unmatched measurements
```

Only finite distances strictly below `TouchMergeDistance2D` are allowed. The existing
`Point3.Squared2DDistance` still computes Manhattan distance; its name does not imply squared
Euclidean units. Neither the metric nor the gate is migrated in this change.

Both costs default to **0.5** and accept finite, non-negative floats. They are public tracker
properties and are also persisted as top-level `TrackingServerAppSettings` fields. REST endpoints
and controls under Settings → Smoothing expose both costs and `UseMinimumCostAssignment`.
The switch defaults to true; false restores the previous greedy one-to-one algorithm without
resetting live track state. Missing legacy fields use true/0.5/0.5; explicit false/zero survive
round trips. Costs remain saved but are ignored in greedy mode. See the
[REST API documentation](../../../docs/software/apps/server/rest-api.md) for the endpoints.
Zero is supported. They are
per-observation association penalties, not changes to elapsed-time confidence or retention.
All currently live tracks have the same miss cost, including tracks recovering from a gap.

For the example above, preserving both IDs costs 100/81 ≈ 1.23457. Matching only 100→80
costs 20/81 + 0.5 + 0.5 ≈ 1.24691, so the complete assignment wins. The all-unmatched
alternative costs 2. More generally, a lone permitted match is preferable to replacement when
its normalized distance is below `AssignmentMissCost + AssignmentBirthCost`.

This is a minimum-cost policy, **not maximum-cardinality matching**. With several competing
tracks, leaving a track missing can be cheaper than forcing all tracks onto weak matches.
Lower penalties encourage fragmentation; higher penalties encourage continuation of less
plausible tracks. Increasing penalties never permits an edge outside the spatial gate.
At exactly equal objective values either optimum is valid; canonical traversal makes the
choice reproducible, without perturbing the primary cost objective.

## Solver and integration

`MinimumCostAssignment` implements a rectangular Hungarian algorithm without a new dependency.
For m measurements and n live tracks, its matrix has m rows and n+m columns:

- A real track column has cost `normalized distance - AssignmentMissCost`, or positive infinity
  if that pair is forbidden.
- Each measurement has a dedicated birth column costing `AssignmentBirthCost`.
- Other measurements' birth columns are forbidden.

The full objective differs from this matrix objective only by the constant
`n * AssignmentMissCost`. Unused real columns therefore represent explicit missed-track costs
without adding n dummy rows. Every row always has a finite birth alternative; negative finite
real-edge costs are intentional. Empty measurements and empty track sets are supported.

The solver uses augmenting paths and row/column potentials, with O(m²(n+m)) time and
O(m(n+m)) matrix storage. The existing input cap limits m to 20; retained live tracks can
exceed that cap. Tracks are ordered by ID and measurements by X, Y and original index for
reproducible equal-cost traversal. Exact duplicate coordinates retain the input-index tie break.
Fresh ID allocation retains the existing input enumeration behavior.

Assignments are computed before updating any track. Expiration is still checked before
assignment; forecasts still target observation time. Matched measurements follow the existing
confirmation and confidence rules. Unmatched measurements create tentative contacts; unmatched
tracks follow the existing Lost, confidence-decay, recovery and expiration rules. Smoothing,
pressure-type transitions and immutable frame snapshots retain their existing implementation.

## Regression coverage

`ContactTrackingRegressionTest` adds:

- The gate-81 fragmentation example in both measurement orders, with no replacement IDs.
- A case where greedy matches both contacts but has a larger total distance: tracks 0/4,
  measurements 3/7, gate 10. The global solution costs 6 instead of 8 distance units.
- Independent effects of miss and birth penalties, including zero costs and recovery after
  deliberately rejecting an otherwise allowed pair.
- Strict gate boundaries despite large miss/birth penalties.
- Rejection of negative, NaN and infinite penalty settings.
- An independent exhaustive oracle over 100 deterministic small problems, with 0–4 tracks,
  0–4 measurements, forbidden edges, births, misses and several penalty settings. The oracle
  enumerates partial matchings and compares the full objective to actual tracking output.

Existing tests also cover prediction, equal-cost decisions, one-to-one matching, extra
measurements, missing observations, confidence, expiration, crossings and smoothing.

Run from the repository root:

```sh
dotnet test test/Library/InteractionTests/InteractionTests.csproj --no-restore -m:1 -nr:false
```

Validation on 19 November 2026: **277 tests passed, 0 failed, 0 skipped** in the complete
InteractionTests project. Existing dependency and obsolete-API warnings remain.

The subsequent [greedy/global replay comparison](assignment-comparison.md) documents identity,
birth and runtime results on all four available recordings.

## Limits and next evaluation

Global optimality applies to this objective within one observation. It does not guarantee
physical finger identity across crossings or fix detection gaps, duplicate physical regions,
latency or motion-model errors. No new physical-sensor or full-replay performance claim is
made by this change. Evaluate real multi-finger recordings using identity switches, false
continuations, fragmentation, missing outputs and processing time before tuning the penalties
or adding uncertainty-aware costs and multi-frame hypotheses.

## References

- [Initial local analysis](analysis.md), especially the greedy and distance-metric findings.
- [Consolidation implementation and replay results](implementation.md).
- [SciPy linear sum assignment documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.linear_sum_assignment.html):
  the assignment problem and a Jonker–Volgenant implementation of the same optimization class.
- [Stone Soup JPDA tutorial](https://stonesoup.readthedocs.io/en/latest/auto_tutorials/08_JPDATutorial.html):
  probabilistic joint association including missed detections.
