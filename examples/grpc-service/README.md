# ReFlex gRPC + Jupyter example

Two containers demonstrate the existing Python interaction processor and a live
notebook showing input depth values, the actual low-pass filter output and detected
interactions. The ReFlex tracking server runs separately on the host.

## Start

Requires Docker with the Compose plugin and a running Docker daemon. From the
repository root:

```sh
docker compose -f examples/grpc-service/compose.yaml up --build -d
docker compose -f examples/grpc-service/compose.yaml logs notebook
```

Open <http://localhost:8888/lab> and use the token from the notebook log (or run
`docker compose -f examples/grpc-service/compose.yaml exec notebook jupyter server list`).
Open `live-interactions.ipynb` and run its cells in order.

- **Without a sensor:** Set `MODE = "demo"` in the first code cell. Stop ReFlex
  interaction processing first. Run all cells to send a moving synthetic profile
  through the real gRPC service and plot the results for 60 seconds.
- **With ReFlex:** Leave `MODE = "observe"`. In the tracking server's Processing
  view select `Remote`, set Address to `http://localhost`, Port to `50051`, and
  enable sensor tracking and interaction processing. Use `Complete Data Set`
  only if all transmitted depths are finite; otherwise disable it. At least 19
  samples are needed. The notebook reads snapshots without submitting frames or
  changing filter settings.

The backend initially uses cutoff `0.1`, factor `100` (its existing defaults).
ReFlex can change these via `Configure`; valid settings satisfy
`0 < cutoff < factor / 2`. The notebook displays the settings actually used.
Demo mode changes them to `2` and `100`; restart the backend before switching
back to ReFlex, or explicitly reapply the desired settings while connected.

Ports 50051 and 8888 are bound to host loopback. Within Compose the gRPC address
is `backend:50051`; the host uses `http://localhost:50051`. No websocket or
SignalR configuration is needed. Jupyter keeps its default token authentication.

## Lifecycle and tests

```sh
# Integration tests: real gRPC calls, comparison with the existing processor,
# intermediate snapshots and invalid-input handling.
docker compose -f examples/grpc-service/compose.yaml exec backend python -m unittest discover -s /app/example/tests -v

# Stop; keep notebook edits in the named notebooks volume.
docker compose -f examples/grpc-service/compose.yaml down
```

Interrupt the kernel to stop a live view early, or rerun its final code cell for
another interval. Frames older than three seconds are marked stale. A backend
restart clears the old snapshot; the observer waits for new data.

Notebook edits survive rebuilds in a named volume. To copy an edited notebook
back to the host before removing volumes:

```sh
docker compose -f examples/grpc-service/compose.yaml cp notebook:/home/reflex/work/live-interactions.ipynb ./live-interactions.saved.ipynb
```

`docker compose -f examples/grpc-service/compose.yaml down --volumes` deletes
**both snapshots and saved notebook edits**. On the next start, Docker populates
the empty notebook volume from the image again. After updating the bundled
notebook, export your edits and reset the volume to load the new version.

## What is visualised?

`RemoteInteractionProcessingService` sends only `DepthValues1d.z`, a flat array
of depths from the ReFlex processing pipeline. Grid dimensions, X/Y and validity
flags are absent. The plots use transmitted indices; with `CompleteDataSet=false`,
these are compacted indices, which ReFlex maps back on receiving the reply.
“Raw” here means input to the Python service, not original camera data.

`backend.py` subclasses the existing processor to capture its filter result and
atomically writes one `latest.json` snapshot per completed request. Jupyter mounts
this volume read-only. Requests and configuration changes are serialised so input,
intermediate signal and interactions always belong to one frame. The algorithm and
protobuf contract are reused, not reimplemented. Snapshot serialization adds work
per frame; this is a debugging example, not a throughput benchmark.

The existing detector is one-dimensional, uses prominence `0.0005`, assigns touch
IDs per frame and returns original depths at the detected indices. It currently
uses Unix milliseconds for timestamps. ReFlex subsequently applies its own depth
conversion, classification, tracking and calibration; the notebook shows the
Python candidates before those steps.

See the [step-by-step recipe](../../docs/software/recipes/grpc-service.md) and
[template documentation](../../docs/software/templates/grpc-service.md).
