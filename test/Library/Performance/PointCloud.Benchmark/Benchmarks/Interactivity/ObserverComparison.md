# Observer comparison — 2026-11-01

## Dynamic sampling optimization

The library now draws sign and magnitude together, using two `Random.Next` calls per sample instead of four. Signed draws in `[-range, range)` map uniformly to the original positive and negative magnitude intervals. A 0/-1 sign mask implements this mapping without a random branch. Random lifetime and sample/list allocation are unchanged. Radii 0 and 1 retain their existing center-sampling behavior.

Fresh before/after measurements use the same workload and ShortRun/InProcess configuration as below. Each operation classifies 20 contacts with 16 dynamic samples per contact. The benchmark-copy control still uses only positive offsets and is included to show run-to-run variation, not as a correctness-equivalent replacement.

| Implementation | Before | After |
| --- | ---: | ---: |
| Positive-only benchmark-copy control | 9.086 µs | 8.579 µs |
| Current library, independent signs | 15.218 µs | 10.485 µs |
| Current library allocation per operation | 19,360 B | 19,360 B |

The measured library mean decreases by 31.1% (4.73 µs per 20 contacts). Relative to the control measured in each run, the time ratio drops from approximately 1.67 to 1.22. This is a short benchmark, so percentages are indicative rather than a universal guarantee. An intermediate two-draw implementation with conditional sign mapping measured 13.349 µs; the final version additionally avoids unpredictable sign branches.

Validation: all 229 InteractionTests pass, including 20 new cases covering even/odd offset ranges, radii 0/1, and all four quadrants. `git diff --check` passes.

To repeat the focused measurement:

```sh
dotnet run -c Release --project test/Library/Performance/PointCloud.Benchmark -- --observer-comparison --filter '*StochasticDynamic*'
```

### Before optimization

```

BenchmarkDotNet v0.15.8, macOS 27.0.1 (26A434) [Darwin 27.0.0]
Apple M2, 1 CPU, 8 logical and 8 physical cores
.NET SDK 10.0.403
  [Host] : .NET 10.0.14 (10.0.14, 10.0.1426.52326), Arm64 RyuJIT armv8.0-a

Job=ShortRun  Toolchain=InProcessEmitToolchain  IterationCount=3  
LaunchCount=1  WarmupCount=3  

```
| Method        | Sampling          | Mean      | Error     | StdDev    | Ratio | Gen0   | Allocated | Alloc Ratio |
|-------------- |------------------ |----------:|----------:|----------:|------:|-------:|----------:|------------:|
| BenchmarkCopy | StochasticDynamic |  9.086 μs | 0.3241 μs | 0.0178 μs |  1.00 | 2.3041 |  18.91 KB |        1.00 |
| Current       | StochasticDynamic | 15.218 μs | 1.7084 μs | 0.0936 μs |  1.67 | 2.3041 |  18.91 KB |        1.00 |


### After optimization

```

BenchmarkDotNet v0.15.8, macOS 27.0.1 (26A434) [Darwin 27.0.0]
Apple M2, 1 CPU, 8 logical and 8 physical cores
.NET SDK 10.0.403
  [Host] : .NET 10.0.14 (10.0.14, 10.0.1426.52326), Arm64 RyuJIT armv8.0-a

Job=ShortRun  Toolchain=InProcessEmitToolchain  IterationCount=3  
LaunchCount=1  WarmupCount=3  

```
| Method        | Sampling          | Mean      | Error     | StdDev    | Ratio | RatioSD | Gen0   | Allocated | Alloc Ratio |
|-------------- |------------------ |----------:|----------:|----------:|------:|--------:|-------:|----------:|------------:|
| BenchmarkCopy | StochasticDynamic |  8.579 μs | 0.2672 μs | 0.0146 μs |  1.00 |    0.00 | 2.3041 |  18.91 KB |        1.00 |
| Current       | StochasticDynamic | 10.485 μs | 4.7198 μs | 0.2587 μs |  1.22 |    0.03 | 2.3041 |  18.91 KB |        1.00 |


## Initial comparison (before optimization)

Comparison of the checked-in benchmark copy of InteractionObserverBase with the current library implementation. This is not a comparison against main or a historical version of InteractionSmoothingBehaviour: both observers use the current smoothing class.

## Reproduce

```sh
dotnet run -c Release --project test/Library/Performance/PointCloud.Benchmark -- --observer-comparison --filter '*'
```

The comparison command uses BenchmarkDotNet ShortRun with the InProcessEmit toolchain because the existing project's assembly name differs from its csproj filename, which breaks default out-of-process project discovery. Three warmup and three measurement iterations, one launch. These short, in-process measurements are indicative; overlapping confidence intervals should not be treated as proven performance differences.

## Workload

- 640 × 480 synthetic depth raster; 20 isolated alternating minima/maxima. Setup validates the expected classifications for both observers.
- Each extremum operation classifies all 20 contacts using 16 samples and radius 12. Configuration, scene construction and fixed/static sample generation are excluded from timing. Dynamic sample generation is included.
- Each smoothing operation processes 20 stationary Push contacts after 25 warmup frames. Moving average, history and smoothing window both 25, retention 1 second, maximum confidence 30, velocity prediction disabled, no event subscribers. Both observers use wall-clock monotonic timestamps, so this measures processing throughput rather than a simulated sensor cadence.
- Smoothing settings are explicitly applied to both observers; the benchmark-copy setter would force a requested smaller window up to the history capacity.
- No sensor capture, raster scanning/detection, networking, calibration or frontend costs are included. The old MultiInteractionObserver.Update clears candidates after detection, so full Update timings would not compare equivalent work.

## Interpretation

Fixed and static sampling are approximately unchanged. Dynamic sampling increases from 8.54 to 14.46 microseconds per 20 contacts (about 69%, or 5.93 microseconds absolute), consistent with the added random sign draws. Allocations are unchanged: 640 bytes for fixed/static, 19,360 bytes for dynamic sampling.

Smoothing measures 56.34 versus 66.28 microseconds, with approximately 220 KB allocated in each case. The short-run confidence intervals overlap substantially; this does not establish an 18% regression, especially because both wrappers call the same current smoothing implementation. A longer isolated run would be needed to attribute this difference.

## Raw BenchmarkDotNet reports

```

BenchmarkDotNet v0.15.8, macOS 27.0.1 (26A434) [Darwin 27.0.0]
Apple M2, 1 CPU, 8 logical and 8 physical cores
.NET SDK 10.0.403
  [Host] : .NET 10.0.14 (10.0.14, 10.0.1426.52326), Arm64 RyuJIT armv8.0-a

Job=ShortRun  Toolchain=InProcessEmitToolchain  IterationCount=3  
LaunchCount=1  WarmupCount=3  

```
| Method        | Sampling          | Mean        | Error        | StdDev    | Ratio | RatioSD | Gen0   | Allocated | Alloc Ratio |
|-------------- |------------------ |------------:|-------------:|----------:|------:|--------:|-------:|----------:|------------:|
| **BenchmarkCopy** | **FixedRadius**       |    **543.5 ns** |  **1,014.28 ns** |  **55.60 ns** |  **1.01** |    **0.12** | **0.0763** |     **640 B** |        **1.00** |
| Current       | FixedRadius       |    505.7 ns |     29.20 ns |   1.60 ns |  0.94 |    0.08 | 0.0763 |     640 B |        1.00 |
|               |                   |             |              |           |       |         |        |           |             |
| **BenchmarkCopy** | **StochasticStatic**  |    **520.0 ns** |    **197.24 ns** |  **10.81 ns** |  **1.00** |    **0.03** | **0.0763** |     **640 B** |        **1.00** |
| Current       | StochasticStatic  |    525.1 ns |     84.61 ns |   4.64 ns |  1.01 |    0.02 | 0.0763 |     640 B |        1.00 |
|               |                   |             |              |           |       |         |        |           |             |
| **BenchmarkCopy** | **StochasticDynamic** |  **8,537.7 ns** |  **2,345.07 ns** | **128.54 ns** |  **1.00** |    **0.02** | **2.3041** |   **19360 B** |        **1.00** |
| Current       | StochasticDynamic | 14,463.7 ns | 10,439.74 ns | 572.24 ns |  1.69 |    0.06 | 2.3041 |   19360 B |        1.00 |


```

BenchmarkDotNet v0.15.8, macOS 27.0.1 (26A434) [Darwin 27.0.0]
Apple M2, 1 CPU, 8 logical and 8 physical cores
.NET SDK 10.0.403
  [Host] : .NET 10.0.14 (10.0.14, 10.0.1426.52326), Arm64 RyuJIT armv8.0-a

Job=ShortRun  Toolchain=InProcessEmitToolchain  IterationCount=3  
LaunchCount=1  WarmupCount=3  

```
| Method        | Mean     | Error    | StdDev   | Ratio | RatioSD | Gen0    | Gen1   | Allocated | Alloc Ratio |
|-------------- |---------:|---------:|---------:|------:|--------:|--------:|-------:|----------:|------------:|
| BenchmarkCopy | 56.34 μs | 10.31 μs | 0.565 μs |  1.00 |    0.01 | 26.9165 | 8.9722 |    220 KB |        1.00 |
| Current       | 66.28 μs | 62.20 μs | 3.409 μs |  1.18 |    0.05 | 26.8555 | 8.9111 |    220 KB |        1.00 |
