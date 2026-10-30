# ReFlex gRPC + Jupyter example (protocol v2)

Two containers demonstrate spatial interaction extraction using the existing
Python backend and a live Jupyter notebook. The tracking server runs on the host.
The notebook shows 2D input depth, the actual SOS-filter output and geometric
extrema. ReFlex classifies those candidates against its ZeroPlane and applies its
dead zone, normalisation, spatial classification, intermediate-extremum removal,
smoothing and confidence filtering afterwards.

## Start and upgrade

Requires a running Docker daemon with Compose. From the repository root:

```sh
docker compose -f examples/grpc-service/compose.yaml up --build -d
docker compose -f examples/grpc-service/compose.yaml logs notebook
```

Open <http://localhost:8888/lab>, enter the token from the logs and open
`live-interactions.ipynb`. Alternatively retrieve the token with
`docker compose -f examples/grpc-service/compose.yaml exec notebook jupyter server list`.
Both published ports (50051 and 8888) are restricted to host loopback.

**Upgrade ReFlex and the backend together.** Protocol v2 requires raster metadata;
old clients are rejected by the backend and new clients reject old backend versions.
The default filter parameters are now **CutOff=2, Factor=100**. Existing saved
ReFlex settings are intentionally unchanged: update them explicitly in the
Processing view and save. ReFlex sends its configured filter values on connection.

Saved notebook volumes retain older notebook files even after rebuilding. Export
edits first, then copy the new bundled file into the running notebook container:

```sh
docker compose -f examples/grpc-service/compose.yaml cp notebook:/home/reflex/work/live-interactions.ipynb ./live-interactions.saved.ipynb
docker compose -f examples/grpc-service/compose.yaml cp examples/grpc-service/notebooks/live-interactions.ipynb notebook:/home/reflex/work/live-interactions.ipynb
```

Reload the notebook from disk and restart its kernel after upgrading the backend/bindings.
If the third plot has no markers despite non-empty snapshot interactions, check for an
old notebook that filters `type` for `PUSH`/`PULL`. Protocol v2 deliberately returns
`type=NONE`: markers must use `extremum_kind` (`MINIMUM`/`MAXIMUM`), with colours
derived from depth relative to ZeroPlane. Replace the persisted notebook as above.

## Modes

- **Observe:** Leave `MODE = "observe"`, then run all cells. In ReFlex select
  `Remote`, Address `http://localhost`, Port `50051`. Start sensor tracking and
  interaction processing. The notebook reads snapshots without changing settings.
- **Demo:** Stop ReFlex interaction processing first, set `MODE = "demo"`, run
  all cells. The notebook configures 2/100 and submits a synthetic 2D scene with
  two pushes, one pull and a missing-data corner. Never run both producers together.

The live cell runs for 60 seconds. Rerun it to continue or interrupt the kernel to
stop. Frames older than three seconds are marked stale. The internal gRPC address
is `backend:50051`, while the host endpoint is `http://localhost:50051`.

## Raster and candidates

`GetState.supports_float32_payload` advertises the optional `z_float32_le` byte
payload. New clients send row-major IEEE754 float32 in little-endian order (four
bytes per sample); older servers continue to receive repeated `z` values. Exactly
one representation must be supplied, with NaN retaining its missing-sample meaning.
The backend validates byte length and reconstructs a NumPy float64 raster directly
from the binary buffer, preserving the previous processing precision.

The demo defaults to 640 × 480; change `DEMO_WIDTH` / `DEMO_HEIGHT` in the notebook
to compare other resolutions. It uses the negotiated payload format too.

`NumSkipValues + 1` is the sample step **on both axes**; Skip=1 retains approximately
one quarter of the points. The request supplies transmitted `width`, `height`,
`sample_step`, `zero_plane` and row-major `z` values. Dimensions round up when the
sensor resolution is not divisible by the step. With `CompleteDataSet=false`,
invalid/filtered samples stay in place as NaN. Non-finite values are always missing.
There is no compacted array or index mapping. Sensor coordinates are
`x=(point_idx % width)*sample_step`, `y=(point_idx // width)*sample_step`.

The backend fills missing samples from their nearest valid neighbour for filtering
only, applies an order-5 Butterworth SOS filter along X and Y, detects spatial
minima/maxima, and refines candidates against original neighbouring depths. A
minimum contrast of 0.0005 rejects ringing on originally flat regions. The search
radius is ten sensor pixels, adjusted for sample step. Returned positions must be
valid interior samples. Entirely missing rasters return an empty result.

Single-pixel extrema avoid plateau-coordinate/centroid allocations; regions whose
original-depth range is below the contrast threshold are discarded before computing
the median. Plateaus retain the previous representative and tie-breaking rules.
Sparse masks with at most 4096 candidate pixels skip full-raster component labelling
when no pixels are 8-connected neighbours. Connected or dense masks use the
component path; full rectangular plateaus compute their centre directly. Candidate
masks use contiguous row-major storage. Large rasters run minimum and maximum
extraction independently in the same reusable worker pool used by the filter;
small rasters keep the serial path. Results remain sorted by kind and raster index.
Butterworth SOS coefficients are cached for up to 32 combinations of cutoff,
factor and sample step; filter order, precision, padding and forward/backward
filtering remain unchanged.

Rasters with at least 65536 samples are filtered by two reusable worker threads.
Work is split perpendicular to the filtered axis, preserving each complete row
and column, its padding and initial conditions. Small rasters use the serial path.
Set `REFLEX_FILTER_WORKERS=1` in the backend environment for serial operation;
values from 2 to 8 select the worker count. Float64 arithmetic is retained.

Effective filter sampling rate is `Factor/sample_step`; require
`0 < CutOff < Factor/(2*sample_step)`. Both raster dimensions must be at least three.
Too large a skip or an unsuitable cutoff produces `INVALID_ARGUMENT`.

The wire response has `extremum_kind=MINIMUM/MAXIMUM` and `type=NONE`. ReFlex decides
PUSH for absolute `z < Distance`, PULL for `z > Distance`, discarding values within
its `MinDistance` dead zone. A geometric maximum is not automatically a pull. Remote uses the same pipeline
as MultiTouch: intermediate extrema are removed before history, and touches are
published only when confidence exceeds `MinConfidence`. New touches can therefore
take several frames to appear; the notebook shows candidates before these filters.
SingleTouch also shares this pipeline but selects at most one interaction after
smoothing: the most recent, with the highest touch ID on timestamp ties.
Confidence filtering still applies, and tracking history remains intact.
Notebook marker shapes show geometry; colours illustrate the depth sign only,
without applying ReFlex's dead zone. Candidate depths are original measurements.
IDs remain per-frame and Python timestamps remain Unix milliseconds.

Snapshots overwrite one JSON file atomically; missing values are encoded as `null`.
The notebook mounts snapshots read-only. A separate process constructs the lists,
encodes JSON and writes the file. The processing path coalesces frame references
in a local single-frame mailbox. A dispatcher transfers the latest pending frame
only when the snapshot process is ready. This avoids serializing and then receiving
and unpickling obsolete multi-megabyte frames on the gRPC handler thread. The
spatial view can skip frames; processing results and per-frame timing history
remain independent. One frame may be in flight while one newer frame is pending.
The worker drains pending work and stops when the gRPC server shuts down.

## Pipeline timing measurements

Rebuild the backend and tracking server after updating the protobuf definitions;
regenerate local Python bindings as described in the backend README. Timing RPCs
are additive to protocol v2. Older backends can still process frames, but must be
updated for the timing notebook.

Enable `MeasurePerformance` in ReFlex and run the notebook's timing cells:

```python
timing_samples, timing_statistics = await measure_pipeline()  # 60 seconds
```

The collector polls all new successful frames from a bounded 4096-event backend
history, merges updates by frame ID, and shows count, mean, standard deviation,
minimum, median, p95, p99 and maximum in milliseconds, a box plot and a latency
timeline. It returns raw samples and statistics for optional CSV export. In
`observe` mode it reads measurements without submitting frames; in `demo` mode it
generates traffic and reports notebook-client timings instead of C# timings.
Run collection after stopping the spatial view. Empty/stopped producers, buffer
overflow and backend restarts are handled explicitly.

Stages cover C# raster conversion and protobuf object construction, RPC roundtrip,
Python lock wait, raster reconstruction, missing-data interpolation, SOS filter,
extrema extraction, response construction, snapshot publication, C# candidate
conversion, depth normalisation, spatial classification/cleanup and smoothing.
The existing performance event includes `RemoteTimingsMs` and `RemoteFrameId`.
Client measurements and their diagnostic reporting RPC are enabled only when
`MeasurePerformance` is active; server timing history is always available.

`client_transport_serialization_overhead` subtracts `server_total` from the RPC
roundtrip (clamped to zero). It includes serialization, transport and gRPC/runtime
overhead, and is not a measurement of pure network latency. Totals overlap their
components and must not all be added. Diagnostic reporting/polling is outside
stage timings but adds load. `server_snapshot_enqueue` is included in
`server_total`; `snapshot_background_write` measures construction/encoding/writing
in the separate process and is outside the synchronous pipeline. Background
timings only exist for completed published snapshots and must not be added to
RPC latency. Only successful frames are recorded, not failures/skips.

The Python gRPC endpoints advertise 1 MiB HTTP/2 DATA frames and 2 MiB stream
read-ahead for full-resolution requests. Channel reuse and byte-payload negotiation
remain unchanged. The transport-overhead metric also includes runtime scheduling
and serialization; it is not a pure network-latency measurement.

## Tests and shutdown

All test RPCs use private listeners, independent of the running sensor service:

```sh
docker compose -f examples/grpc-service/compose.yaml exec backend python -m unittest discover -s /app/tests -v
docker compose -f examples/grpc-service/compose.yaml exec backend python -m unittest discover -s /app/example/tests -v
docker compose -f examples/grpc-service/compose.yaml exec notebook python /app/example/tests/check_notebook.py
dotnet test test/Library/InteractionTests/InteractionTests.csproj -c CI
```

The recorded CSV under `services/python-backend/tests/fixtures/` contains an
unmodified 640x480 framework frame with ZeroPlane 1.45: two pushes and one pull.
The regression checks those deformations at Skip 0/1/3, original-depth support for
any extra candidates, and missing/invalid data handling. Its JSON sidecar records
provenance, expected locations and the CSV checksum.

```sh
docker compose -f examples/grpc-service/compose.yaml down
```

Notebook edits persist in a named volume. `down --volumes` deletes both snapshots
and saved notebooks; export edits before using it. On restart the backend removes
old snapshots and the notebook waits for new frames.

See the [recipe](../../docs/software/recipes/grpc-service.md) and
[template overview](../../docs/software/templates/grpc-service.md).
