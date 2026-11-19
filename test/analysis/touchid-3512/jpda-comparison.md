# Replay comparison: global assignment versus JPDA

19 November 2026. Production code: `4290171a` on `feature/jpda`.

This report preserves the **original, unoptimized** implementation's results. See the subsequent
[runtime optimization and repeated comparison](jpda-optimization.md) for the current implementation,
paired original/optimized timings and recovery-preservation checks.

**The available recordings show no reduction in single-target ID changes or created tracks from
JPDA.** Both strategies create **38 tracks**, with **zero published ID changes** in the three
single-target recordings, with either linear prediction or the tuned Kalman model. No ID is
recovered beyond ordinary retention. Multi-Touch outputs nevertheless differ substantially.
JPDA adds computation, especially in dense-group frames: the mean update time rises by
**36–39% with linear prediction** and **216–233% with Kalman** in the two paired campaigns.

These are tracking-stage measurements on the available inputs, not an annotated evaluation of
physical finger identities. The results support keeping JPDA optional and disabled by default;
they neither demonstrate its intended long-occlusion benefit on these recordings nor disprove
recovery in the controlled regression cases.

## Controlled setup

Both variants instantiate the **same current production tracker**. The baseline has `UseJpda=false`
and `UseMinimumCostAssignment=true`; the candidate changes only `UseJpda=true`. JPDA takes precedence
over the saved ordinary assignment choice while enabled. No historical source substitution or
production algorithm/parameter changes were made for this comparison.

Two independent motion profiles isolate assignment from the previous Kalman change:

- **linear:** prediction over three actual samples, no polynomial acceleration, moving-average
  XY smoothing over three samples; Kalman is disabled in both assignment variants.
- **kalman:** the tuned constant-velocity XY filter is enabled in both variants, with
  `R = 4 px²`, `q = 400000 px²/s³`, initial velocity variance `10000 (px/s)²`.

Inputs are the original pre-assignment captures already used in the
[global/greedy comparison](assignment-comparison.md) and [Kalman comparison](kalman-comparison.md).
All eight capture/reference SHA-256 hashes match those earlier inputs. Both strategies receive
identical measurements, detector confidence, candidate order and nominal observation times.
Detection and consolidation are not rerun separately, and historical assigned IDs are not inputs.

| Recording | Directory under `wwwroot/recordings` | Frames | Measurements | Maximum measurements/frame |
| --- | --- | ---: | ---: | ---: |
| Half-Circle | `2026-11-03_10-21-51` | 258 | 398 | 2 |
| Line | `2026-11-03_10-19-39` | 340 | 177 | 1 |
| Circle | `2026-11-03_10-17-09` | 229 | 229 | 1 |
| Multi-Touch | `2026-11-03_10-20-23` | 430 | 1363 | 10 |
| **Total** | | **1257** | **2167** | **10** |

Shared settings: nominal 30 Hz times `100 + frame/30`, history 15, depth scale 490, strict
Manhattan gate `< 81 px`, miss/birth costs 0.5 each, publication clustering distance 58,
confidence minimum 0 and maximum 30, gain/decay 30/s, contact retention 0.1 s, observation
timeout 1 s and diagnostic forecast horizon 0.05 s. Assignment forecasts to the observation time,
without that additional diagnostic horizon. Captures already include 3 px extremum consolidation.
Push/Pull type separation is identical in both variants.

JPDA uses the unchanged implementation defaults: temperature 0.15, masking threshold of 20% of
the selected winner's association probability, bounded masked-ID retention of 1 s, at most 256
partial events per validation component, and ordinary-assignment fallback above 64 track targets.
See [the implementation description](jpda.md) for the discrete joint-event model and hard output.

## Metrics

- **Published target ID changes:** choose the published contact nearest the strongest deformation
  decoded from the source images. Count changes only across consecutive active-input frames with
  target output in both. Pauses/output gaps reset the comparison. Half-Circle excludes the stationary
  region within 60 px of (249,210). These are reference metrics, not annotated MOT identities.
- **Created tracks:** every newly allocated internal ID, including tentative, stationary,
  confidence-filtered and cluster-suppressed contacts. This is not a count of physical new fingers.
- **Raw representative changes:** the same reference selection on assigned actual measurements,
  before smoothing and publication filtering, also requiring consecutive active frames.
- **Reassociation after a gap:** an existing ID receives a real measurement after at least one
  intervening observation without a measurement for that ID.
- **Recovery beyond retention:** such a reassociation occurs strictly later than the last real
  measurement time plus 0.1 s. It directly distinguishes the extended JPDA window from ordinary
  within-retention recovery in these nominal-time replays.
- **Multi-Touch:** there are no annotated finger trajectories. Its strongest-region representative
  can move between fingers, so these changes cannot be interpreted as physical ID switches.

There is no independent positional ground truth, physical-ID accuracy score or calibrated
uncertainty-coverage claim. In particular, fewer distinct published IDs or fewer representative
changes do not by themselves establish better finger tracking.

## Identity, births and missing output

Cells show **global → JPDA**. This table holds for **both motion profiles** and both processes:

| Recording | Published single-target ID changes | Created tracks | Active frames without target output |
| --- | ---: | ---: | ---: |
| Half-Circle | 0 → 0 | 4 → 4 | 10 → 10 |
| Line | 0 → 0 | 9 → 9 | 25 → 25 |
| Circle | 0 → 0 | 1 → 1 | 1 → 1 |
| Multi-Touch | Not annotated | 24 → 24 | 4 → 4 |
| **Total created tracks** | | **38 → 38** | |

Active reference frames are 154 / 198 / 229 / 407. Raw representative changes in the first three
recordings remain 0 / 3 / 0 in both strategies. Line's three internal changes are hidden by the
published-change definition's output/gap conditions; zero published changes do not prove perfect
internal identity continuity.

Multi-Touch has different representative/publication behavior:

| Motion model | Raw representative changes | Published representative changes | Distinct published target IDs | Created tracks |
| --- | ---: | ---: | ---: | ---: |
| linear | 5 → 5 | 3 → 3 | 10 → 9 | 24 → 24 |
| kalman | 4 → 5 | 4 → 3 | 11 → 9 | 24 → 24 |

The Kalman profile's published representative count improves while its raw count worsens. Neither
change establishes a physical identity improvement. The same number of internal tracks is created;
the lower number of published IDs reflects different association/publication choices.

### Masking and recovery are different events

| JPDA diagnostic | Linear profile | Kalman profile |
| --- | ---: | ---: |
| Multi-Touch frames with reserved masked IDs | 61 | 61 |
| Maximum simultaneously reserved IDs | 7 | 6 |
| Multi-Touch frames using beam pruning | 33 | 33 |
| Frames using the >64-target fallback, all recordings | 0 | 0 |
| Recoveries beyond ordinary retention, all recordings | **0** | **0** |

The other three recordings produce no JPDA reservations or pruned frames. JPDA's ambiguity handling
is therefore exercised in Multi-Touch, but its reserved identities do not subsequently receive real
measurements after a gap. Reservation alone must not be reported as successful ID reconstruction.

The only observed reassociation is **Line, ID 8, frame 301**, previously measured at frame 298.
It spans two missing observations and approximately 0.1 s, within the inclusive ordinary retention
limit, and is not published in that frame. It occurs in **both strategies and both motion profiles**.
It is not a benefit from the extended JPDA recovery window.

## Different outputs despite unchanged aggregate birth/switch counts

Full assigned, tracked and published interaction data were compared frame by frame. Results are
identical across the two measurement processes:

| Recording | Different assigned-output frames | Different tracked-output frames | Different published-output frames |
| --- | ---: | ---: | ---: |
| Half-Circle | 0 | 0 | 0 |
| Line | 0 | 0 | 0 |
| Circle | 0 | 0 | 0 |
| Multi-Touch | **90 / 430** | **96 / 430** | **96 / 430** |

These counts hold for both motion profiles. All 827 frames of the first three recordings have
identical complete outputs. In Multi-Touch, both the published ID set and ordered ID list differ
in **59 frames** per profile. Thus unchanged representative-switch/birth totals do not mean that
users receive identical IDs in every frame.

The first divergence is zero-based **frame 283**. Its pre-assignment targets are identical between
variants and the JPDA event calculation is **not pruned** in that frame:

- Linear: ID 0 is assigned `(165.29, 198)` globally versus `(168.32, 198)` with JPDA; ID 6 receives
  the opposite assignment. Both complete event costs are approximately **1.7098598**.
- Kalman: ID 0 is assigned `(160.01, 198)` globally versus `(165.29, 198)` with JPDA; ID 7 receives
  the opposite assignment. Both complete event costs are approximately **1.7056374**.

Reconstructing production float32 Manhattan distances gives cost differences of only about
`2.2e-16`, at floating-point summation precision. This is an effectively tied assignment, resolved
differently by the Hungarian solver and joint-event ordering/arithmetic. The first divergence is
therefore not evidence of extended ID recovery or beam pruning. The different labelled histories
then influence subsequent frames; later dense-group approximations can also affect decisions.

Maximum XY deviation between the two published positions **for the same numeric ID** is:

| Profile | Deviation | Frame | ID |
| --- | ---: | ---: | ---: |
| linear | 5.46 px | 291 | 10 |
| kalman | 29.04 px | 320 | 10 |

These are differences between algorithms, not measured position errors. All differing complete
outputs and their stored matching targets are retained in each process's `differences.json`.

## Runtime

Release, .NET SDK 10.0.403 / runtime 10.0.14, macOS 27.2.1, Arm64, eight logical processors.
Each process runs ten full warm-up replays per variant and recording, then 31 measured replays
in alternating global/JPDA and JPDA/global order, with fresh tracker state for every replay.
Four processes run sequentially: linear P1, Kalman P1, linear P2, Kalman P2.
There are **77,934 timed updates per assignment strategy and motion profile** across the two
processes, **311,736 updates in total**. There were no concurrent analysis builds/tests, forced
collections or isolation from other operating-system activity.

Timing separately brackets `Tracker.Update` and the following `GetVelocities`. Combined time is
the sum of those two intervals for each frame. Quality evaluation, reflection inspection,
independent re-evaluation of joint probabilities, snapshots and all serialization are outside the
timed region. Each untimed joint inspection is checked against the actual production assignments.

### Tracking-update median and p95

Microseconds per frame. Quantiles pool the 31 replays of each recording; p95 uses rank
`ceil(n × 0.95)`. All frames, including births and empty observations, are retained.

**Linear motion profile:**

| Recording | Global P1 median / p95 | JPDA P1 median / p95 | Global P2 median / p95 | JPDA P2 median / p95 |
| --- | ---: | ---: | ---: | ---: |
| Half-Circle | 36.17 / 99.71 | 37.46 / 105.42 | 33.25 / 82.38 | 34.12 / 91.04 |
| Line | 11.62 / 17.92 | 11.75 / 19.08 | 13.62 / 22.08 | 14.12 / 24.17 |
| Circle | 14.42 / 20.17 | 15.00 / 21.58 | 18.75 / 29.33 | 19.12 / 30.29 |
| Multi-Touch | 42.79 / 144.75 | 43.50 / 461.83 | 40.67 / 138.12 | 42.83 / 456.21 |

**Kalman motion profile:**

| Recording | Global P1 median / p95 | JPDA P1 median / p95 | Global P2 median / p95 | JPDA P2 median / p95 |
| --- | ---: | ---: | ---: | ---: |
| Half-Circle | 9.92 / 15.62 | 13.92 / 19.79 | 11.12 / 14.42 | 14.96 / 18.67 |
| Line | 3.54 / 5.00 | 4.62 / 6.08 | 3.42 / 8.29 | 4.33 / 10.54 |
| Circle | 2.25 / 2.58 | 2.58 / 3.04 | 2.79 / 3.04 | 3.75 / 4.17 |
| Multi-Touch | 2.75 / 8.08 | 3.71 / 327.38 | 2.83 / 8.38 | 4.42 / 332.12 |

JPDA's median overhead is often modest, while its Multi-Touch p95 rises from about **138–145 to
456–462 µs** with linear prediction, and from about **8 to 327–332 µs** with Kalman.
Thirty-three pruned Multi-Touch frames represent 7.7% of that recording, consistent with a heavier
dense-group timing tail. Per-stage costs of event generation and retention were not isolated.
The median alone hides the observed additional workload.

### Mean cost across all recordings

Microseconds per frame, weighted by actual frame counts. These are **means**, not medians;
values are computed from the retained replay timing totals.

| Motion model | Process | Update mean, global → JPDA | Change | Update + diagnostics mean, global → JPDA | Change |
| --- | ---: | ---: | ---: | ---: | ---: |
| linear | 1 | 35.29 → 48.14 | +36.4% | 67.46 → 80.86 | +19.8% |
| linear | 2 | 33.72 → 46.95 | +39.2% | 64.56 → 78.91 | +22.2% |
| kalman | 1 | 4.77 → 15.90 | +233.3% | 5.26 → 16.39 | +211.5% |
| kalman | 2 | 5.19 → 16.38 | +215.7% | 5.74 → 16.96 | +195.6% |

`GetVelocities` is mostly unchanged within a motion profile, so including it reduces the relative
JPDA overhead, especially for the more expensive polynomial-motion diagnostics. Full separate and
combined median/p95 values remain in `results.json`. For example, Multi-Touch combined p95 is
about **606–619 µs** with linear JPDA and **328–333 µs** with Kalman JPDA.

The additional work includes joint-event generation, probabilities and marginalization, as well
as forecasting retained masked tracks. This measures the complete tracking stage with each
strategy's actual state, not only the association solver in isolation. Parsing, JPEG decoding,
sensor filtering, detection, consolidation, publication clustering, calibration, uncertainty
contours, frontend rendering, network and server timers are excluded. These are not end-to-end
latencies or FPS measurements; relative ratios with a very small Kalman baseline should be read
alongside the absolute microsecond values.

## Interpretation and artifacts

On these recordings, JPDA costs additional tracking time without a demonstrated reduction in
single-target ID changes or new internal contacts. Its intended extended recovery is supported
by controlled overlap/crossing regressions, but **not demonstrated by an actual beyond-retention
reassociation in this replay set**. Validating that benefit requires annotated recordings where
contacts merge, one remains masked longer than ordinary retention, and both reappear within the
recovery window. The different Multi-Touch outputs cannot be ranked for physical identity without
such annotations. No production settings or algorithm changes were made to improve these results.

- [Implementation behavior and limits](jpda.md).
- [Shared comparison runner](../../touchid-analysis/MotionComparison.cs) and
  [reproduction commands](../../touchid-analysis/README.md#paired-globaljpda-comparison).
- [Independent verifier](../../touchid-analysis/verify_jpda_comparison.py) and
  [derived summary/provenance](jpda-comparison/summary.json).
- Linear: [process 1 results](jpda-comparison/linear/process-1/results.json),
  [process 1 artifacts](jpda-comparison/linear/process-1/),
  [process 2 results](jpda-comparison/linear/process-2/results.json),
  [process 2 artifacts](jpda-comparison/linear/process-2/).
- Kalman: [process 1 results](jpda-comparison/kalman/process-1/results.json),
  [process 1 artifacts](jpda-comparison/kalman/process-1/),
  [process 2 results](jpda-comparison/kalman/process-2/results.json),
  [process 2 artifacts](jpda-comparison/kalman/process-2/).

Each artifact set includes per-frame metrics (`frames.csv`), compact raw/published trajectories
(`tracks.json`), complete differing outputs (`differences.json`), all real reassociations
(`reassociations.csv`), raw representative changes (`association-changes.csv`) and replay timing
totals (`timing-replays.csv`). Results retain input/source SHA-256, complete settings, explicit
per-variant overrides, compiled constants and runtime information. Captures were reused from
`/tmp/reflex-assignment-20261119`; README commands can regenerate them from the available JPEGs.

Release build and all four comparison processes completed successfully. The independent Python
audit reconstructs identities, births, gaps, missing output and target-ID counts from saved tracks
and references, checks source/input hashes, timing totals and exact process-to-process quality
agreement. The existing `--compare-motion --quality-only` path was also checked against the archived
tuned-Kalman quality results after sharing the runner; its original quality metrics are unchanged.
