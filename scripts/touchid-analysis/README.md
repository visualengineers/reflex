# TouchId replay diagnostics

Run from the repository root with the recordings present in the TrackingServer's `wwwroot/recordings` directory. Requires the repository's .NET SDK and restored dependencies; the summarizer uses Python's standard library.

```sh
dotnet run --project scripts/touchid-analysis/TouchIdAnalysis.csproj -- /tmp/reflex-touchid-analysis
dotnet run --no-build --project scripts/touchid-analysis/TouchIdAnalysis.csproj -- --inputs /tmp/reflex-touchid-analysis
dotnet run --no-build --project scripts/touchid-analysis/TouchIdAnalysis.csproj -- --analyze /tmp/reflex-touchid-analysis
python3 scripts/touchid-analysis/summarize.py /tmp/reflex-touchid-analysis docs/analysis/touchid-3512
```

Captures use the actual ReplayCamera and production filter/observer/manager classes, with nominal timestamps to isolate association from machine speed. They process every frame once, without wrapping to the start. Existing capture files are reused; use a fresh directory to capture again. Files contain classified measurements, diagnostics including suppression reasons, final interactions and a SingleTouch control. Raw candidate counts and confidence ranges are stored without retaining large lists of pixel candidates.

`--inputs` independently decodes the original JPEGs using the ReplayCamera RGB24 depth mapping and records the strongest deformation. For Half-Circle, the stationary pressure region at (249,210), radius 60 pixels, is excluded when assessing the moving contact. This is a recording-specific diagnostic assumption, not a proposed tracking algorithm.

`--analyze` compares unchanged tracker behavior on the same classified candidates: prediction off, linear 3/9 samples, quadratic 3, larger gate, confidence threshold 2, and every other frame. It additionally produces controlled reversal and greedy-assignment examples. Its representative-switch metric uses the strongest classified candidate and includes transitions across gaps; the CSV summarizer instead uses source-image positions and counts changes only across consecutive active output frames. Track births include every internal candidate track, including stationary and suppressed tracks.

To inspect processing-age expiry with the real monotonic clock, run a short MultiTouch-only capture into a separate directory:

```sh
REFLEX_WALL_CLOCK=1 REFLEX_FRAME_LIMIT=12 dotnet run --no-build --project scripts/touchid-analysis/TouchIdAnalysis.csproj -- /tmp/reflex-touchid-wall-production
```

This measures a synchronous diagnostic pipeline in the selected build configuration, not full server timer/remote/network throughput. It includes filtering, vector-field computation, snapshot construction and interaction analysis. SingleTouch control updates are omitted in this mode. The nominal capture still runs both observer types. The default profile is deliberately `TrackingSettings_default.json`, whose 1.45 m plane matches ReplayCamera; the stored Kinect configuration does not.

Results and interpretation: [analysis.md](../../docs/analysis/touchid-3512/analysis.md). No production tracking behavior is modified.
