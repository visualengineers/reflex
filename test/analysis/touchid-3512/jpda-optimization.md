# JPDA runtime optimization and repeated replay comparison

19 November 2026, `feature/jpda`, working tree based on `5f52500b`. The original JPDA algorithm
is pinned to `4290171a`; the intervening commit adds the previous replay measurements.

**The optimization reduces dense-group runtime while preserving the tested association and
recovery behavior.** In paired original/optimized replay processes, mean tracking-update time
falls by **15.5–17.3% with linear prediction** and **30.5–39.2% with Kalman**. Multi-Touch p95
falls by **34–42%**. Complete replay outputs, matching targets, reserved-ID sets and pruning flags
are unchanged in both motion profiles and both processes.

No beam reduction, weaker masking criterion, shorter recovery window or changed Kalman/assignment
parameters were used to obtain the speedup. Positive recovery controls and existing lifecycle
tests continue to pass. The recordings themselves still contain no recovery beyond ordinary
retention, so the positive preservation evidence comes from the controlled cases and differential
probability checks, not a newly demonstrated physical-finger recovery in the recordings.

## Implementation changes

The previous implementation created an `Event` object and copied an assignment array for every
feasible expansion, then sorted/selectively retained at most 256 partial events. Dense components
therefore created substantial garbage for events immediately discarded.

The optimized implementation:

- Keeps the **same best 256 events** with a bounded worst-first heap. Losing expansions are rejected
  at its boundary without allocating an event or a path.
- Uses compact value entries containing only score and ordering rank. Parent and selected column
  are decoded after selection; paths are copied only for retained events.
- Uses call-local stack spans for beam/path/weight working storage, bounded by the existing
  20-candidate/64-target limits. No shared mutable scratch buffers or unsafe pointers are added.
  The internal candidate limit is now checked before sizing the stack storage; production already
  caps candidates at 20 before calling the helper.
- Precomputes each gated edge's score once, preserving the original arithmetic grouping.
- Represents validation connections and available track choices as bitsets rather than per-component
  hash sets and repeated full-column scans.
- Evaluates each retained exponential weight once and reuses it for normalization and marginals.

Sorting the retained entries by score and a deterministic ordinal preserves the old stable ordering,
including ties at the beam boundary. The ordinal orders parent events first, then canonical track
columns, with birth last. The smaller boundary comparison is marked for aggressive inlining on the hot expansion path.
Separate validation components, the approximation flag and the selected full hard event retain
their original meanings. Result matrices and canonical ordering still allocate; this is not a
claim of zero allocation for the entire helper or tracking stage.

Unchanged constants/contracts: beam 256, temperature 0.15, masking odds 0.2 relative to the selected
winner, recovery window 1 s (or ordinary retention if longer), normal retention 0.1 s for this
experiment, strict Manhattan gate 81 px, miss/birth costs 0.5 each, pressure-type separation,
64-target fallback, Kalman defaults and opt-in setting/persistence/API behavior.

## Verification of unchanged ID recovery

A preserved reference of the original helper supports **194 differential scenarios**: 192 seeded
examples and two dense all-tie cases. They cover empty inputs, isolated groups, mixed types,
zero/fractional costs, beam pruning, up to 20 measurements and 64 track targets. Assignments,
association/birth/miss probability arrays, approximation flags and masking decisions match without
loosening numeric tolerances.

The full suite passes **361 InteractionTests**, including the original crossing, publication/cache
expiry, six-way overlap, timeout, toggle/reset/history and inclusive-deadline recovery regressions.
**17 ARM64 server settings integration tests** also pass; no frontend or setting contract changed.

In addition, each original/optimized comparison executes six separate control scenarios outside
timing, using both tracker implementations:

| Control | Expected allocated IDs | Result |
| --- | ---: | --- |
| Pair masked beyond ordinary retention, then separated | 2 | Same old IDs recovered; complete outputs identical |
| Moving crossing with one temporarily masked contact | 2 | Same directional identities recovered; complete outputs identical |
| Six contacts merged and separated | 6 | Same six IDs recovered; complete outputs identical |
| Reappearance exactly at the recovery deadline | 2 | Inclusive recovery unchanged |
| Reappearance after the deadline | 3 | Expired masked ID replaced by a new ID |
| JPDA disabled | 3 | Ordinary expiry behavior unchanged |

These run with linear and Kalman motion in both measurement processes. Full per-frame control
outputs are retained in `recovery-controls.json`, including an assertion that the crossing's
right-moving contact remains ID 0 and its left-moving contact ID 1. The controls are synthetic
regressions, separate from the real replay figures below.

A deterministic pure-helper allocation regression at the dense 20-contact limit measures
**9,835,728 → 9,976 managed bytes per call**, a **99.90% reduction** after warm-up. It guards memory
allocation rather than imposing a machine-dependent runtime threshold.
[Validation evidence](jpda-comparison/optimized/tests.json) records counts, source/reference hashes
and that measurement.

## Replay and baseline methodology

All four existing recordings are reused: Half-Circle 258 frames/398 measurements, Line 340/177,
Circle 229/229 and Multi-Touch 430/1363, totaling **1,257 frames and 2,167 measurements**. Their eight
capture/reference SHA-256 values match the previous global/JPDA and Kalman experiments.

Motion profiles and remaining configuration are unchanged from the
[original JPDA replay report](jpda-comparison.md): linear fit over three real samples versus the
tuned XY Kalman model (`R=4`, `q=400000`, initial velocity variance 10000), nominal 30 Hz observation
and completion times, history 15, three-sample smoothing, confidence 0–30 with gain/decay 30/s,
publication clustering 58 px, observation timeout 1 s and diagnostic horizon 0.05 s.

There are two distinct paired comparisons:

1. **Original versus optimized JPDA**, both enabled. The original tracker plus six private helpers
   are extracted from `4290171a` and compiled into the diagnostic executable after **type-name
   prefixing only**. They share the public Common/Filtering types. Embedded source hashes and a
   reconstruction from git verify that baseline. Production projects do not compile these copies.
2. **Current global versus optimized JPDA**, to repeat the original comparison with a fresh paired
   control. All settings and motion profiles remain equal within a pair.

Both implementations are called through identically typed delegates bound once before timing.
For each recording/variant/process there are ten complete warm-up replays and 31 measured replays
in alternating AB/BA order, with fresh state each time. Two processes per motion profile and pair
produce eight sequential campaigns: the four original/optimized and global/optimized combinations
for P1, then the same four for P2. There are **77,934 updates per variant and motion profile in
each comparison**, **623,472 timed updates overall**.

Release, .NET SDK 10.0.403 / runtime 10.0.14, macOS 27.2.1, Arm64, eight logical processors.
No concurrent analysis builds/tests or forced collections ran during the measured campaigns;
other system activity was not isolated. The original/optimized in-process pairs are the basis for
attributing the optimization benefit. Absolute times from the older report are not subtracted
from these new campaigns, since system/JIT conditions can differ.

## Replay identity and output results

For **both original and optimized JPDA**, in both motion profiles and processes:

| Recording | Published single-target ID changes | Created tracks | Frames without target output |
| --- | ---: | ---: | ---: |
| Half-Circle | 0 → 0 | 4 → 4 | 10 → 10 |
| Line | 0 → 0 | 9 → 9 | 25 → 25 |
| Circle | 0 → 0 | 1 → 1 | 1 → 1 |
| Multi-Touch | Not annotated | 24 → 24 | 4 → 4 |

Total births remain **38 → 38**. More strongly than those aggregate metrics, **all assigned,
tracked and published replay frames are identical** between original and optimized JPDA.
All inspected matching targets, reserved-ID sets and approximation flags also match. No differing
frame is retained in the original/optimized `differences.json` files.

Multi-Touch continues reserving IDs in 61 frames, at most seven simultaneously with linear motion
or six with Kalman, and pruning in 33 frames. Neither implementation recovers a replay ID beyond
ordinary retention. Both have the same one within-retention Line reassociation at frame 301,
ID 8, last measured at frame 298. This is not an extended JPDA recovery benefit.

The fresh global/optimized comparison reproduces the earlier quality findings: 38 births in both
strategies, zero single-target published changes, and Multi-Touch differences in 90 assigned and
96 tracked/published frames, including different published ID sets in 59 frames. Linear Multi-Touch
representative changes remain 3 → 3; with Kalman they remain 4 → 3 in published output and 4 → 5 in
raw output. Without annotated fingers these proxy changes do not rank physical identity accuracy.

## Original versus optimized runtime

Times are microseconds per frame. `Update` includes forecast, assignment, confidence/lifecycle,
history and smoothing. `GetVelocities` is timed separately. Medians and p95 pool all frames from
31 replays; p95 uses rank `ceil(n × .95)`. Births and empty frames are included.

**Linear prediction, Update median / p95:**

| Recording | Original P1 median / p95 | Optimized P1 median / p95 | Original P2 median / p95 | Optimized P2 median / p95 |
| --- | ---: | ---: | ---: | ---: |
| Half-Circle | 38.33 / 96.21 | 36.21 / 88.17 | 46.50 / 84.54 | 44.50 / 81.50 |
| Line | 10.33 / 17.83 | 10.54 / 18.50 | 11.42 / 24.12 | 11.17 / 23.67 |
| Circle | 15.71 / 29.58 | 16.04 / 29.96 | 13.50 / 28.96 | 14.17 / 28.58 |
| Multi-Touch | 41.71 / 445.92 | 41.17 / 259.54 | 40.71 / 442.42 | 41.08 / 255.21 |

**Kalman prediction, Update median / p95:**

| Recording | Original P1 median / p95 | Optimized P1 median / p95 | Original P2 median / p95 | Optimized P2 median / p95 |
| --- | ---: | ---: | ---: | ---: |
| Half-Circle | 14.67 / 20.71 | 11.29 / 16.38 | 14.25 / 20.96 | 10.83 / 16.33 |
| Line | 4.88 / 8.38 | 4.17 / 7.21 | 5.42 / 7.75 | 3.83 / 6.21 |
| Circle | 2.71 / 2.92 | 2.92 / 3.21 | 3.92 / 4.17 | 1.83 / 1.96 |
| Multi-Touch | 4.38 / 331.71 | 3.58 / 217.71 | 3.96 / 333.29 | 3.62 / 205.21 |

The dense Multi-Touch tail decreases from approximately **442–446 to 255–260 µs** with linear
prediction, and **332–333 to 205–218 µs** with Kalman. Sparse/small cases benefit less, and some
individual medians increase slightly; this is not a guarantee that every frame becomes faster.

Mean times below weight all recordings by actual frame counts; they are **means, not medians**:

| Motion | Process | Original update | Optimized update | Change | Original update + diagnostics | Optimized update + diagnostics | Change |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| linear | 1 | 47.00 | 38.85 | -17.3% | 81.79 | 71.07 | -13.1% |
| linear | 2 | 47.25 | 39.91 | -15.5% | 83.42 | 75.73 | -9.2% |
| kalman | 1 | 16.17 | 11.25 | -30.5% | 16.62 | 11.76 | -29.2% |
| kalman | 2 | 16.64 | 10.13 | -39.2% | 17.20 | 10.59 | -38.4% |

Managed allocation counters surround Update plus diagnostics **outside** the stopwatch intervals.
They exclude tracker construction, timing-list bookkeeping and quality inspection. They measure
current-thread managed allocations, not live heap size, process RSS, native memory or stack space:

| Motion | Process | Original bytes/frame | Optimized bytes/frame | Reduction |
| --- | ---: | ---: | ---: | ---: |
| linear | 1 | 140,451 | 109,666 | 21.9% |
| linear | 2 | 140,565 | 109,735 | 21.9% |
| kalman | 1 | 41,395 | 10,524 | 74.6% |
| kalman | 2 | 41,374 | 10,543 | 74.5% |

The relative allocation benefit is smaller with linear prediction because repeated polynomial
fitting still allocates substantially. No motion algorithm was changed to obtain the speedup.

## Remaining overhead versus global assignment

Fresh paired **mean Update** times, microseconds per frame:

| Motion | Process | Global update mean | Optimized JPDA update mean | JPDA overhead |
| --- | ---: | ---: | ---: | ---: |
| linear | 1 | 36.94 | 42.28 | +14.5% |
| linear | 2 | 32.17 | 38.84 | +20.7% |
| kalman | 1 | 7.98 | 13.71 | +71.8% |
| kalman | 2 | 6.01 | 12.09 | +101.2% |

JPDA therefore still has a real cost relative to the global solver, especially on dense events
and against the small Kalman baseline. Keeping the full recovery semantics and the same beam
means the probabilistic event work is not eliminated. The optimization does not justify enabling
JPDA by default or claim a new identity benefit in these unannotated recordings.

All timing excludes parsing, detector/image processing, consolidation, publication clustering,
reference metrics, reflection audits, serialization, calibration, rendering, networking and server
timers. These are tracking-stage measurements, not end-to-end latency or FPS.

## Artifacts and reproduction

- [Optimized helper](../../../library/src/Core/Interactivity/Util/JpdaContactAssignment.cs),
  [differential/allocation tests](../../Library/InteractionTests/JpdaOptimizationTest.cs),
  [original reference](../../Library/InteractionTests/Reference/JpdaContactAssignmentReference.cs).
- [Commands and baseline preparation](../../touchid-analysis/README.md#jpda-runtime-optimization-comparison),
  [baseline generator](../../touchid-analysis/prepare_jpda_baseline.py),
  [shared replay runner](../../touchid-analysis/MotionComparison.cs) and
  [independent verifier](../../touchid-analysis/verify_jpda_comparison.py).
- [Original/optimized verified summary](jpda-comparison/optimized/original-vs-optimized/summary.json),
  [linear artifacts](jpda-comparison/optimized/original-vs-optimized/linear/),
  [Kalman artifacts](jpda-comparison/optimized/original-vs-optimized/kalman/).
- [Global/optimized verified summary](jpda-comparison/optimized/global/summary.json),
  [linear artifacts](jpda-comparison/optimized/global/linear/),
  [Kalman artifacts](jpda-comparison/optimized/global/kalman/).

Every campaign retains settings/overrides, compiled constants, input/current-source SHA-256,
baseline-source provenance, full frame metrics, trajectories, differences, reassociations and
replay timing/allocation totals. The verifier independently reconstructs metrics, checks hashes,
validates exact quality agreement between processes, requires zero original/optimized output and
diagnostic differences, and verifies all six recovery controls. Original pre-optimization replay
artifacts remain unchanged. Release builds, all eight campaigns and both audits completed
successfully; `git diff --check` passes.
