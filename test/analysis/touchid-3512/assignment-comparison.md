# Replay comparison: greedy versus global assignment

19 November 2026. The global assignment changes **neither ID-switch counts nor track births**
in the available recordings with the current consolidation and prediction settings. Half-Circle,
Line and Circle produce identical complete tracker outputs. Multi-Touch differs internally in
eight frames and in published position/measurement metadata in five frames, while publishing
the same IDs in every frame. Across two measurement processes, the global variant's median
`Tracker.Update` time is 0.3–2.7% higher, an absolute difference of approximately 0.2–1.6 µs.
These recordings do not demonstrate an ID-stability improvement from replacing greedy assignment.

## Controlled comparison

The baseline is `InteractionSmoothingBehaviour` from commit
`1877755ef80934f5800eb3f5a717bb9d18d508cb`, immediately before the local global-assignment
implementation. `prepare_greedy_baseline.py` extracts that source using `git show` and renames
only its class and constructor to `GreedyInteractionSmoothingBehaviour`. This historical class
is compiled into the diagnostic executable, with its source and provenance metadata embedded
and SHA-256 checked. The production library continues to use global assignment.

All recordings were freshly processed once through the actual `DepthStreamReplayCamera`,
production filters, observer and manager. Both trackers then received the **same captured,
pre-assignment measurements**, in the same order and with the same detector confidence and
nominal observation timestamps. No repeated detection, different candidate enumeration or
changed settings can account for a difference between the two assignment variants within this
comparison. Capture preprocessing does not depend on the tracker's assigned IDs.

| Recording | Local recording directory | Frames | Measurements | Maximum measurements/frame |
| --- | --- | ---: | ---: | ---: |
| Half-Circle | `2026-11-03_10-21-51` | 258 | 398 | 2 |
| Line | `2026-11-03_10-19-39` | 340 | 177 | 1 |
| Circle | `2026-11-03_10-17-09` | 229 | 229 | 1 |
| Multi-Touch | `2026-11-03_10-20-23` | 430 | 1363 | 10 |
| **Total** | | **1257** | **2167** | **10** |

All recordings are 640 × 480 JPEG/RGB24 at nominally 30 Hz. Settings are
`TrackingSettings_default.json`, with the ReplayCamera-compatible 1.45 m plane, 3 px extremum
consolidation, linear prediction over three samples, history capacity 15, moving-average smoothing
over three samples, depth scale 490, strict Manhattan assignment gate 81, publication cluster
distance 58, minimum confidence 0, maximum confidence 30, confidence gain/decay 30/s,
contact retention 0.1 s and observation timeout 1 s. Global miss and birth costs are each 0.5.
Nominal timestamps isolate contact association from processing speed and server scheduling.

The diagnostic reproduction of confidence filtering and publication clustering is checked against
the original global production capture. **All 1,257 published outputs match**, including their
complete interaction data. This guards against accidentally measuring a different publication path.

## Metric definitions

- **ID changes:** the existing source-image-reference metric from `summarize.py`. Select the
  published output nearest the strongest input deformation, and count changes only between
  consecutive frames with active input and a target output in both. Contact pauses and output
  gaps are excluded. For Half-Circle, the stationary pressure region within 60 px of (249,210)
  is excluded. These are reproducible proxy measurements, not manually annotated finger identities.
- **Created tracks:** every tentative contact born inside the tracker, including stationary,
  confidence-filtered and cluster-suppressed tracks. This counts newly allocated IDs; it does
  not assert that a new physical finger touched the surface.
- **Published target IDs:** distinct IDs seen in target output over the complete recording.
- **Active without output:** active source-image frames without a target output. This separates
  missing publication from the consecutive-output ID-change metric.
- **Multi-Touch:** individual fingers have no annotated reference trajectories. Its strongest-region
  representative can legitimately move between fingers, so physical ID-switch counts are reported
  as unavailable. Representative changes are retained separately as diagnostics.

## Identity and birth results

Cells show **greedy → global**.

| Recording | ID changes | Created tracks | Published target IDs | Active frames without output |
| --- | ---: | ---: | ---: | ---: |
| Half-Circle | 0 → 0 | 4 → 4 | 3 → 3 | 10 → 10 |
| Line | 0 → 0 | 9 → 9 | 7 → 7 | 25 → 25 |
| Circle | 0 → 0 | 1 → 1 | 1 → 1 | 1 → 1 |
| Multi-Touch | Not annotated | 24 → 24 | 10 → 10 | 4 → 4 |

Total created tracks remain **38 → 38**. Active source-image frames are 154 / 198 / 229 / 407.
Multi-Touch's strongest-region representative changes three times in both variants, at zero-based
frames 282, 321 and 379; these are not evidence of three physical identity errors.

The full tracker outputs match in all 827 frames of the first three recordings. In Multi-Touch:

- Eight of 430 tracker-output frames differ: 283–286 and 320–323.
- Five published-output frames differ: 283–286 and 320.
- Every frame still publishes the same ordered list of IDs. Birth and Lost counts also remain unchanged.
- At frame 283, reassociation changes ID 0's smoothed X position from 183.17 to 184.93 px,
  with Y=207.33 px. The 1.76 px difference persists in its held Lost output at frames 284–286.
- At frame 320, published ID 10 moves from (124.11,196.77) to (114.63,203.85), an XY
  difference of **11.83 px**. At frames 321–323, differences remain only in internal tracks
  suppressed from publication.

The five published differences concern position and legacy `Interaction.Time` copied from the
selected measurement. Published IDs, type, confidence and tracking state are unchanged. These
examples show that globally choosing different measurements can alter reported coordinates even
when aggregate ID metrics are identical. Without physical finger annotations they do not establish
that either trajectory is more accurate. Full inputs and both outputs for these eight frames are
preserved in [differences.json](assignment-comparison/differences.json).

The earlier improvements in [implementation.md](implementation.md) came from extremum
consolidation and confidence handling. Those fixes are already enabled in **both** variants here;
they must not be attributed to global assignment. In particular, the Line and Circle sequences have
at most one measurement per frame after consolidation, and Half-Circle's contacts are well separated.
The constructed competing-assignment regression cases remain the direct demonstration of the
specific failure corrected by the new solver.

## Runtime results

Release builds used .NET SDK 10.0.403, runtime 10.0.14, macOS 27.2.1, Arm64, with eight logical
processors reported by .NET. Parsing and reference-image analysis finish before timing. Each
variant is accessed through an identically typed delegate, bound once outside the timed region.

Timing starts immediately before `Tracker.Update(measurements, observationTime)` and ends
immediately after it returns. It includes prediction, assignment, confidence/lifecycle processing,
history and smoothing. It excludes tracker construction, JSON parsing, image decoding, sensor
filtering, extremum detection/consolidation, reference metrics, publication clustering and server
networking/timers. It measures the **tracking stage**, not the assignment solver in isolation and
not end-to-end pipeline latency.

For each recording and process, both variants receive ten complete warm-up replays, followed by
31 measured replays, alternating greedy/global and global/greedy order. Track state starts fresh
for every replay. All frames, including births and empty frames, remain in the measured data;
there is no additional first-frame exclusion after the complete warm-ups. Two sequential process
campaigns were retained, for **77,934 timed updates per variant** in total. Process 2 additionally
exports full differing outputs; its timed update path is unchanged. Neither process ran alongside
the capture or input-decoding jobs. No forced collections or background-system isolation were used.

Per-update median and p95 pool all frames from the 31 replays of each recording; p95 uses rank
`ceil(0.95 × n)`. The following table shows **process 2**, in microseconds:

| Recording | Median greedy | Median global | Median change | p95 greedy | p95 global |
| --- | ---: | ---: | ---: | ---: | ---: |
| Half-Circle | 62.96 | 64.08 | +1.8% | 90.50 | 94.75 |
| Line | 24.88 | 25.08 | +0.8% | 40.08 | 40.92 |
| Circle | 18.17 | 18.58 | +2.3% | 25.42 | 26.71 |
| Multi-Touch | 51.46 | 51.63 | +0.3% | 176.58 | 172.04 |

The independently measured process 1 is retained to expose timing variation:

| Recording | Median greedy (µs) | Median global (µs) | Median change | p95 greedy (µs) | p95 global (µs) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Half-Circle | 61.13 | 62.75 | +2.7% | 94.50 | 86.13 |
| Line | 21.63 | 21.92 | +1.4% | 37.96 | 39.96 |
| Circle | 19.21 | 19.54 | +1.7% | 28.63 | 37.88 |
| Multi-Touch | 51.63 | 52.00 | +0.7% | 176.63 | 171.71 |

These are ratios of per-update medians, not medians of paired replay ratios. The raw per-replay
totals allow separate paired analyses. Median global cost is slightly higher in every recording
in both processes. The largest difference between per-update medians is 1.63 µs, versus a nominal
33,333 µs frame interval at 30 Hz. This supports a small absolute tracking-stage overhead at the
observed workload; it is not proof that the complete pipeline meets that interval.

Tail behavior is less stable: Half-Circle's p95 difference changes sign between processes, and
Circle's p95 magnitude changes appreciably. GC, JIT/tiering and scheduling remain possible
contributors. No statistical significance or general throughput improvement is claimed. These
recordings reach at most ten measurements per frame, so they do not characterize worst-case
behavior at the 20-measurement cap or with many retained tracks.

## Data, validation and reproduction

- [Process 2 results and provenance](assignment-comparison/results.json): metrics, settings,
  baseline revision, embedded-source hash, current-source hashes, capture/input hashes and platform.
- [Process 2 per-frame results](assignment-comparison/frames.csv): 2,514 rows, one per variant/frame.
- [Differing full outputs](assignment-comparison/differences.json): all eight Multi-Touch cases.
- [Process 2 timing replays](assignment-comparison/timing-replays.csv): 248 recording/variant/repeat totals.
- [Process 1 results](assignment-comparison/process-1-results.json) and
  [timing replays](assignment-comparison/process-1-timing-replays.csv).

The Release diagnostic build completed successfully. The global reconstructed publication matched
the production capture in every frame; both process campaigns reproduced the same identity and
birth metrics. Frame ordering, reference/capture length and baseline-source provenance are checked
by the tool. This comparison did not change production tracking code.

Raw captures are local at `/tmp/reflex-assignment-20261119`; JPEG recordings remain in the local
server recording directories. They are not newly committed. Use the exact shared capture for a
bit-for-bit repeat; a fresh detector run can alter candidate enumeration and legacy measurement
timestamps. Each new paired comparison still uses the same capture for both variants.

See [the diagnostic README](../../touchid-analysis/README.md#paired-greedyglobal-assignment-comparison)
for the complete capture/build/compare commands. Run the comparison twice with separate output
directories to reproduce two process campaigns. The baseline is pinned, while current-source
hashes identify the tested working tree containing the global solver.

Further evidence of a physical identity benefit requires annotated multi-finger trajectories with
competing associations, crossings, short occlusions and close neighboring contacts. The present
result supports retaining the global solver for its defined optimization behavior and tested corner
cases, while making no measured replay ID-stability benefit claim for these recordings.
