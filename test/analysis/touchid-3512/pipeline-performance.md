# PR #3512: replay pipeline performance

Initial measurement: 6 November 2026, MacBook Air, Apple M2 (8 CPU cores), macOS 27.0.1, .NET SDK 10.0.403, runtime 10.0.14 (arm64). Release builds ran sequentially in separate processes: `main` (`139a1b4ee88f0d57306dd10035f12a903bedc59c`), then `fix/interaction-smoothing-behaviour` (`6ab3d6f9ea19600352e2484efefcef07354c287f`). Later sections document successive optimizations and remeasurements.

## Measurement setup

- Each branch replayed the same local JPEG recordings from `tools/ReFlex.TrackingServer/wwwroot/recordings` once, in numeric frame order. All are 640 × 480 at nominally 30 Hz.
- Each decoded frame synchronously passed through production `DepthImageManager` and `InteractionManager` in MultiTouch mode. Timing starts immediately before `DepthImageManager.Update` and ends after `InteractionManager.Update`, excluding decoding, replay waits, server timers and networking.
- Each branch used its `TrackingSettings_default.json` with a 1.45 m reference plane. PR settings: 3 px consolidation radius, linear velocity prediction (3 samples, 50 ms horizon), 100 ms contact retention, 1 s observation timeout. `main` retained contacts for three missing frames.
- In the temporary PR build, depth-image manager and observer used nominal timestamps `100 + FrameIndex / 30` seconds. A monotonic stopwatch measured runtime independently. This isolates local computation; observation expiry on the live server requires real-time and server-timer measurements.
- Filter and observer `MeasurePerformance` were enabled. `filter_ms` and `observer_ms` come from `PerformanceDataUpdated`. The observer reports before interaction output; the outer stopwatch includes output. CSVs also contain search, depth-conversion, classification and smoothing times.
- The first 20 frames per recording remain in raw data but are excluded as warm-up. p95 uses rank `ceil(0.95 × n)`; totals weight frames equally. Percentage changes are relative to `main`.

| Recording | Local recording directory | Frames |
| --- | --- | ---: |
| Half-Circle | `2026-11-03_10-21-51` | 258 |
| Line | `2026-11-03_10-19-39` | 340 |
| Circle | `2026-11-03_10-17-09` | 229 |
| Multi-Touch | `2026-11-03_10-20-23` | 430 |

## Initial results

Both branches reported `Available` for all 1,257 frames; 1,177 per branch remain after warm-up. PR median processing time was **5.7 times** that of `main`.

| Recording | Frames | Median main (ms) | Median PR (ms) | Δ Median | p95 main (ms) | p95 PR (ms) | Δ p95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Half-Circle | 238 | 21.06 | 135.42 | +543.0 % | 41.74 | 175.79 | +321.2 % |
| Line | 320 | 23.27 | 134.67 | +478.6 % | 43.44 | 177.80 | +309.3 % |
| Circle | 209 | 24.60 | 138.34 | +462.3 % | 42.89 | 176.00 | +310.3 % |
| Multi-Touch | 410 | 24.55 | 132.78 | +440.8 % | 45.08 | 171.80 | +281.1 % |
| **Total** | **1177** | **23.66** | **134.73** | **+469.5 %** | **43.42** | **174.84** | **+302.7 %** |

The 33.33 ms budget for 30 Hz was exceeded by 298/1,177 frames (25.3%) on `main` and all PR frames. PR computation alone therefore exceeded the capture interval in this synchronous replay.

| Stage | Median main (ms) | Median PR (ms) |
| --- | ---: | ---: |
| Total depth-image processing | 11.58 | 85.65 |
| ↳ Filtering including point-cloud update | 7.20 | 6.74 |
| ↳ Remaining depth-image processing | 4.37 | 78.83 |
| Total observer | 12.05 | 47.30 |
| ↳ Extremum search | 11.95 | 47.13 |
| ↳ Depth conversion | 0.04 | 0.04 |
| ↳ Extremum classification | < 0.01 | < 0.01 |
| ↳ Smoothing including consolidation in PR | 0.03 | 0.06 |

Most additional depth-image time was outside filtering. Per-frame `depth_ms - filter_ms` includes vector-field calculation, events and, on the PR, point-cloud/vector-field copies into `TrackingObservation`. Most observer overhead was in extremum search. These figures come from one run per build on the same machine.

## Grid-copy and extremum-search diagnostics

Using the same builds, settings and nominal timestamps, each variant replayed the first 72 frames of each recording in a separate process. Excluding 20 warm-up frames per recording left 208 frames per variant.

`TrackingObservation` instrumentation timed destination-grid creation and copying of values/validity flags. Search retained the built-in `ProcessPerformance.Update` metric. Counters recorded raw candidates before classification/consolidation, replay-thread depth-path allocations, process-wide parallel-search allocations and cumulative GC-pause changes. GC counters support comparisons but cannot attribute a pause to one allocation.

Three PR grid modes were tested: **fresh** grids per observation, **reused** destination grids, and **direct** source-grid access. Both controls require analysis to finish before the next frame. The old angle formula `angleX + angleY / 2f` was also compared with `(angleX + angleY) / 2f`. Instrumentation and controls used temporary builds.

### Grid-copy costs

| Grid | Fresh Median (ms) | Fresh p95 (ms) | Reused Median (ms) | Reused p95 (ms) |
| --- | ---: | ---: | ---: | ---: |
| Point cloud | 24.51 | 47.30 | 1.56 | 1.95 |
| Vector field | 47.31 | 81.84 | 1.37 | 1.50 |
| **Both grids per frame** | **73.16** | **108.15** | **2.97** | **3.25** |

The total uses each frame's sum of both copies. Median depth-path allocation on the replay thread was 61.49 MB/frame with fresh grids versus about 2.38 kB with reuse. At 640 × 480, constructors initialize two sets of `Point3` and three sets of `Vector2`: roughly 1.54 million objects/frame. Some are immediately replaced by references into flat arrays when linking flat and jagged arrays; the vector field also creates a separate interpolation grid.

### Search regression

| Build | Grid | Angle formula | Search median (ms) | Search p95 (ms) | GC pause during search, median (ms) | Raw candidates, median |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| PR | Fresh | Corrected | 42.99 | 65.92 | 35.61 | 10298.5 |
| PR | Fresh | Old | 42.31 | 67.58 | 34.75 | 9828.5 |
| PR | Reused | Corrected | 10.45 | 42.45 | 6.71 | 10298.5 |
| PR | Direct | Corrected | 11.44 | 31.35 | 6.93 | 10298.5 |
| PR | Direct | Old | 10.86 | 30.80 | 6.90 | 9828.5 |
| `main` | Direct | Old | 10.69 | 30.77 | 6.84 | 9828.5 |

Reuse reduced median search time by about 32.5 ms and median GC pause during search by 28.9 ms. With identical formulas, raw candidate counts matched every frame across grid modes. Search itself allocated about 41 MB/frame in every variant: four `Vector2.Add` calls create temporary vectors per valid grid position, plus candidate objects for hits. Fresh snapshots add allocation pressure before this stage; the controls identify the resulting GC overhead as the main search regression.

The corrected formula increased median raw candidates by 4.8%. With fresh grids, the old formula reduced median search time by only 0.68 ms. With direct access and the old formula, PR and `main` differed by 0.18 ms and had identical per-frame candidate counts. Each control ran once, so small timing differences indicate only scale.

Data: [pipeline-performance-diagnostics.csv](pipeline-performance-diagnostics.csv).

## Safe grid reuse

In production, `InteractionManager` copies each completed grid pair into owned buffers. A pending pair may be overwritten by the next sensor frame; once an update acquires it, it is protected until asynchronous processing finishes. The last processed pair remains available for distance calculations and diagnostics until the observer processes another, then becomes reusable. Dimension/stride changes allocate matching buffers. Public `ObservationReady` subscribers retain an independent copy.

Release builds of the same `main` commit and the branch with production reuse ran sequentially on the same machine, using the original settings, recordings, nominal times, measurement boundaries and warm-up. Timing used local MultiTouch. Separate tests held a remote call open while pending frames were overwritten and grid dimensions changed.

Both builds reported `Available` for all 1,257 frames; the table covers 1,177 after warm-up.

| Recording | Frames | Median main (ms) | Median PR (ms) | Δ Median | p95 main (ms) | p95 PR (ms) | Δ p95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Half-Circle | 238 | 21.78 | 22.82 | +4.8 % | 41.80 | 65.81 | +57.4 % |
| Line | 320 | 24.59 | 24.68 | +0.4 % | 46.17 | 65.15 | +41.1 % |
| Circle | 209 | 25.77 | 25.74 | −0.1 % | 48.56 | 67.97 | +40.0 % |
| Multi-Touch | 410 | 26.36 | 25.43 | −3.5 % | 46.96 | 67.31 | +43.3 % |
| **Total** | **1177** | **25.14** | **25.04** | **−0.4 %** | **45.86** | **66.67** | **+45.4 %** |

Compared with the initial PR run, median fell from 134.73 to 25.04 ms and p95 from 174.84 to 66.67 ms. Medians matched remeasured `main` closely, but PR p95 remained 20.81 ms higher. Budget overruns were 212 frames (18.0%) with reuse versus 294 (25.0%) on `main`: fewer overruns, but longer slowest frames.

| Stage | Median main (ms) | Median PR (ms) |
| --- | ---: | ---: |
| Depth-image processing | 12.10 | 12.87 |
| ↳ Filtering including point-cloud update | 7.63 | 7.35 |
| ↳ Remaining depth-image processing | 4.47 | 5.52 |
| Total observer | 12.89 | 12.02 |
| ↳ Extremum search | 12.79 | 11.87 |
| ↳ Smoothing including consolidation in PR | 0.03 | 0.06 |

Published contact counts matched the initial PR run in all 1,257 frames. Timings come from one full run per build.

All eight sensor-pipeline tests passed, including the new in-flight remote-call, superseded-frame and resize test. InteractionTests passed 256/257; `ObservationTimeIsCapturedBeforeRemoteAnalysis` also failed on the unchanged baseline.

Data: [remeasured main](pipeline-performance-reuse-main.csv), [PR with reuse](pipeline-performance-reuse-pr.csv).

## Remaining p95 latency

In the reuse data, search p95 rose from 33.33 to 53.55 ms (+20.22 ms), close to the pipeline increase of 20.81 ms. Depth-stage p95 was 14.14 / 15.37 ms, smoothing 0.05 / 0.15 ms. Among each build's 59 slowest frames, median search time rose from 36.76 to 56.08 ms, while depth processing was 12.51 / 13.03 ms. Slow searches occurred in all four recordings.

### Instrumented replay and scalar-vector control

Three separate Release processes replayed all recordings: `main` at `139a1b4e`, PR with reuse at `f7b41e35`, and a scalar-vector PR control. Setup matched the previous measurement (1,177 evaluated frames per variant). Process-wide .NET counter changes during the parallel scan tracked allocations, GC pauses, collections and lock contention; search time came from the observer metric.

| Variant | Pipeline Median (ms) | Pipeline p95 (ms) | Search p95 (ms) | GC pause during search p95 (ms) | Search allocation median (MB/Frame) |
| --- | ---: | ---: | ---: | ---: | ---: |
| `main` | 25.34 | 49.29 | 34.58 | 24.10 | 41.01 |
| PR with reuse | 25.71 | 70.34 | 56.15 | 34.77 | 41.12 |
| PR with reuse, scalar vector arithmetic | 16.25 | 38.54 | 23.95 | 15.99 | 2.09 |

The instrumented run reproduced a **21.05 ms** p95 gap despite similar median search allocations. In the 59 slowest pipeline frames, PR median search time was 62.31 ms versus 38.87 ms on `main`; recorded GC pause was 38.71 versus 23.46 ms. PR search time correlated more strongly with GC pause (Pearson *r* = 0.94) than raw candidates (*r* = 0.32) or lock contention (*r* = 0.36). These process-wide counters do not separate concurrent GC work from scheduling; p95 differences are not additive components of the gap.

The scalar control used local `float` values for identical vector sums and normalized dot products, preserving the angle formula, parallel scan, candidate list and lock. Removing up to four temporary `Vector2` objects per valid position cut search allocation by about 95%. Raw candidate and published contact counts matched the instrumented PR in all 1,257 frames; pipeline p95 fell below measured `main`.

### Retained-grid control

Three more PR processes replayed the first 100 frames of each recording, leaving 320 per variant after warm-up. All used the object-based scan: production reuse; direct source-grid access; and direct access with two unused snapshot pairs retained on the heap. This separates retained-grid lifetime from copying and search access.

| PR control | Pipeline p95 (ms) | Search p95 (ms) | GC pause during search p95 (ms) | Search median with Gen2 collection (ms) |
| --- | ---: | ---: | ---: | ---: |
| Production reuse | 66.65 | 53.40 | 28.39 | 51.41 |
| Direct grid access | 44.69 | 32.67 | 23.64 | 27.79 |
| Direct, two extra grid pairs retained on heap | 66.73 | 54.13 | 30.72 | 51.67 |

Candidate/contact counts matched every frame. Without a recorded Gen2 collection, median search time was 10.11–10.38 ms in all variants. With production reuse, all 16 slowest pipeline frames included a Gen2 collection during search. Direct access actually had more search windows with Gen2 collections (100/320 versus 48/320), but those windows were much shorter.

Retaining only two extra grid pairs restored latency spikes without changing source-grid access or adding copies. The approximately 41 MB/frame of temporary search allocations made GC more expensive alongside retained snapshot objects. The scalar control reduced spikes while keeping snapshots. Each diagnostic variant ran once in a temporary build; direct access requires synchronous replay.

Data: [pipeline-performance-tail.csv](pipeline-performance-tail.csv).

## Production scalar extremum search

`MultiInteractionObserver` now calculates both normalized dot products directly from `float` components, removing four temporary vector sums per valid grid position. Operation order, averaging and undefined-cosine handling match the previous PR. Parallel scanning and snapshots remain included.

### Detection equivalence and tests

Two separate verification runs compared the object-based PR with production scalar arithmetic. **All 1,257 frames** had identical SHA-256 hashes for raw candidates sorted by grid position: X/Y/Z/confidence bit patterns before depth conversion and classification. Published contacts sorted by TouchId also matched, including position, confidence, ID, interaction type, tracking state and extremum description. Only the system-time-dependent legacy timestamp was excluded. Verification used identical nominal times, skipped replay waits and was excluded from performance measurements.

Three added edge tests cover equality at the threshold, zero vectors and infinite components. The remaining `ObservationTimeIsCapturedBeforeRemoteAnalysis` failure was fixed in `f2d2fea4`: the simulated clock previously jumped backward from 20 s to 10.1 s after the first remote call. A 10 s completion gap exceeded the 1 s observation timeout, losing the first contact and leaving only one velocity sample.

The corrected test uses monotonic capture/completion times with different latencies within the timeout. It verifies both measurements retain one contact and yield 20 px/s from the 100 ms capture interval. **All 260 InteractionTests passed** in Release.

### Release replay against main

`main` at `139a1b4e` and PR at `f7b41e35` with production scalar arithmetic were remeasured on the same machine using the original setup. Both reported `Available` for all 1,257 frames. Each ran once; 1,177 frames remain after warm-up.

| Recording | Frames | Median main (ms) | Median PR (ms) | Δ Median | p95 main (ms) | p95 PR (ms) | Δ p95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Half-Circle | 238 | 22.42 | 15.85 | −29.3 % | 45.22 | 26.75 | −40.9 % |
| Line | 320 | 24.80 | 16.18 | −34.7 % | 48.04 | 38.06 | −20.8 % |
| Circle | 209 | 25.66 | 16.38 | −36.2 % | 49.45 | 42.21 | −14.6 % |
| Multi-Touch | 410 | 25.36 | 15.85 | −37.5 % | 46.39 | 36.32 | −21.7 % |
| **Total** | **1177** | **24.92** | **16.07** | **−35.5 %** | **47.21** | **37.61** | **−20.3 %** |

Median search time was 2.46 ms versus 12.58 ms on `main`; search p95 was 22.42 versus 33.85 ms. Pipeline p95 fell from the earlier reuse run's 66.67 to 37.61 ms. The 33.33 ms budget was exceeded by 313/1,177 frames on `main` and 83 on the scalar PR.

Data: [new main run](pipeline-performance-scalar-main.csv), [production scalar PR](pipeline-performance-scalar-pr.csv).

## Snapshot switch comparison

The local Release build based on `57cb8907` was measured with production `UseObservationSnapshots` enabled and disabled. Both modes used scalar search, identical settings and all four recordings. Each mode ran once per setup in a separate process on the same machine.

- **Synchronous:** each sensor callback fully processes its frame. Nominal capture times allow comparison with earlier benchmarks. Latency spans callback entry through analysis completion, excluding JPEG decoding and replay waits.
- **Independent clocks:** the replay emulator targets 30 Hz; an independent 30 ms timer calls production `InteractionManager.Update` and drains any pending observation after the final sensor frame. Real monotonic latency includes waiting for processing. Both setups exclude networking and server broadcasts.

Median/p95 include only processed frames at index 20 or later per recording. Losses distinguish input drops from prepared but unconsumed frames; an analysis call without a new frame is not another loss.

### Synchronous replay

| Recording | Median on (ms) | Median off (ms) | p95 on (ms) | p95 off (ms) | Skipped on / off |
| --- | ---: | ---: | ---: | ---: | ---: |
| Half-Circle | 15.68 | 15.24 | 23.19 | 22.44 | 0 / 0 |
| Line | 17.23 | 15.52 | 54.53 | 30.64 | 0 / 0 |
| Circle | 17.24 | 15.72 | 54.91 | 32.78 | 0 / 0 |
| Multi-Touch | 16.17 | 15.29 | 33.90 | 31.35 | 0 / 0 |
| **Total** | **16.30** | **15.43** | **39.77** | **30.75** | **0 / 0** |

Both modes processed all 1,257 frames. Disabling snapshots reduced median by about 0.87 ms and p95 by 9.03 ms. Median depth processing fell from 13.70 to 12.64 ms; median search stayed near 2.5 ms. Of 1,177 post-warm-up frames, 93 exceeded 33.33 ms with snapshots and 33 without.

### Independent-clock replay

Latencies cover processed frames after warm-up; frame counts cover complete recordings.

| Recording | Median on (ms) | Median off (ms) | p95 on (ms) | p95 off (ms) | Skipped on / off |
| --- | ---: | ---: | ---: | ---: | ---: |
| Half-Circle | 31.45 | 25.66 | 49.71 | 38.50 | 18 / 103 |
| Line | 31.49 | 26.59 | 57.42 | 44.68 | 25 / 128 |
| Circle | 31.93 | 25.49 | 63.03 | 42.66 | 15 / 81 |
| Multi-Touch | 29.05 | 25.51 | 59.99 | 42.80 | 24 / 157 |
| **Total** | **30.65** | **26.00** | **55.13** | **42.80** | **82 / 469** |

| Status of 1,257 input frames | Snapshots on | Snapshots off |
| --- | ---: | ---: |
| Analyzed | 1175 | 788 |
| Dropped at sensor input | 0 | 126 |
| Prepared but not analyzed | 82 | 343 |
| **Total skipped** | **82 (6.5 %)** | **469 (37.3 %)** |

Without snapshots, analysis reserves the live grid pair and the producer drops incoming frames while it is reserved. While the producer is busy, the analysis timer cannot acquire it; a newer observation can replace the pending one before the next tick. Snapshots let both stages work concurrently on separate grids. Only the latest pending observation is retained.

Without snapshots, latency was also lower for the 688 post-warm-up frames processed in both modes: median/p95 26.18/43.00 ms versus 28.05/50.14 ms with snapshots. This lower p95 came with substantially lower input coverage. Loss rates depend on timing and runtime distribution; actual average input rates were 30.0–30.3 Hz per recording/mode.

### Detection comparison

Separate synchronous verification runs with identical nominal capture times produced identical raw-candidate and published-contact SHA-256 hashes in **all 1,257 frames**. Fields, sorting and legacy-timestamp exclusion match the scalar verification above; hashing was outside timing runs.

With independent clocks, processed sequences and timestamps differ. Among 736 frames analyzed in both modes, published contact counts differed in 48: only snapshot mode published contacts in 17, only live mode in 3. These are time-dependent pipeline differences under this schedule; synchronous comparison isolates detection for identical sequences.

Data: [pipeline-performance-snapshot-switch.csv](pipeline-performance-snapshot-switch.csv). `SensorDropped` marks input drops; `NotConsumed` marks prepared frames without analysis. Their latency fields are 0 and excluded from percentiles.

## Initial raw data

- [main frames](pipeline-performance-main.csv)
- [PR frames](pipeline-performance-pr.csv)

CSVs contain zero-based frame indices, millisecond timings, published contact counts and per-frame status.
