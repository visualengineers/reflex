# ReFlex gRPC + Jupyter example (protocol v2)

Two containers demonstrate spatial interaction extraction using the existing
Python backend and a live Jupyter notebook. The tracking server runs on the host.
The notebook shows 2D input depth, the actual SOS-filter output and geometric
extrema. ReFlex classifies those candidates against its ZeroPlane and applies its
dead zone, normalisation, smoothing and spatial classification afterwards.

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

Reload the notebook and restart its kernel after upgrading the backend/bindings.

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

Effective filter sampling rate is `Factor/sample_step`; require
`0 < CutOff < Factor/(2*sample_step)`. Both raster dimensions must be at least three.
Too large a skip or an unsuitable cutoff produces `INVALID_ARGUMENT`.

The wire response has `extremum_kind=MINIMUM/MAXIMUM` and `type=NONE`. ReFlex decides
PUSH for absolute `z < Distance`, PULL for `z > Distance`, discarding values within
its `MinDistance` dead zone. A geometric maximum is not automatically a pull.
Notebook marker shapes show geometry; colours illustrate the depth sign only,
without applying ReFlex's dead zone. Candidate depths are original measurements.
IDs remain per-frame and Python timestamps remain Unix milliseconds.

Snapshots overwrite one JSON file atomically; missing values are encoded as `null`.
The notebook mounts snapshots read-only. JSON writes add work per frame, so this
adapter is for learning/debugging, not a throughput benchmark.

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
