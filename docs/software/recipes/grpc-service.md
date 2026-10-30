---
title: "ReFlex Server: Create a gRPC service with live Jupyter visualisation"
---

# {{ page.title }}

<!-- omit in toc -->
## Table of Contents

1. [General approach](#general-approach)
2. [Step 1: Define a spatial gRPC contract](#step-1-define-a-spatial-grpc-contract)
3. [Step 2: Sample and reconstruct in ReFlex](#step-2-sample-and-reconstruct-in-reflex)
4. [Step 3: Extract spatial extrema in Python](#step-3-extract-spatial-extrema-in-python)
5. [Step 4: Observe the backend in two containers](#step-4-observe-the-backend-in-two-containers)
6. [Step 5: Connect and upgrade ReFlex](#step-5-connect-and-upgrade-reflex)
7. [Step 6: Verify the recorded scene and lifecycle](#step-6-verify-the-recorded-scene-and-lifecycle)
8. [Further reading](#further-reading)

## General approach

The runnable example in `examples/grpc-service/` combines the existing Python backend with a separate JupyterLab container. ReFlex runs on the host, with its sensor support, and acts as a gRPC **client**. The Python backend extracts geometric candidates; ReFlex determines Push/Pull and performs its subsequent interaction processing. The notebook observes input, intermediate data and candidates.

```text
ReFlex tracking server (host)
    regular 2D sampling -> gRPC ComputeInteractions
        v
Python backend container :50051
    missing-data fill -> SOS along X/Y -> spatial extrema -> original-depth check
        | candidates -> ReFlex index reconstruction -> ZeroPlane/dead zone -> processing
        | atomic latest.json
        v
shared frames volume (read-only for Jupyter)
        v
Jupyter container :8888 -> browser: three 2D plots
```

The notebook also has a synthetic demo mode. Do not run it concurrently with ReFlex processing: both producers share the backend's configuration and latest snapshot. "Input" means the depths supplied to the Python processor; ReFlex sensor preprocessing has already run. Notebook candidates are not the final tracked and calibrated touch stream.

__[⬆ back to top](#table-of-contents)__

## Step 1: Define a spatial gRPC contract

Keep the C# and Python `interactionTypes.proto` definitions synchronised. The service retains its three RPCs:

| RPC | Purpose |
| --- | --- |
| `GetState` | Readiness, frame ID and `protocol_version=2`. |
| `Configure` | Butterworth `cutoff` and `factor`; both must be finite with `0 < cutoff < factor/2`. |
| `ComputeInteractions` | A regular depth raster in `DepthValues1d`, returning an `InteractionFrame`. |

Protocol v2 adds `width`, `height` and `sample_step` to the depth request. Width and height describe the **transmitted** raster, not the original sensor resolution. `z` is row-major, so `index = y*width+x`, and its length must equal `width*height`. Missing values are NaN. The existing `zero_plane` field carries ReFlex's current `Distance`; the existing min/max-depth fields are not required by this detector.

Each returned candidate carries its transmitted `point_idx`, original absolute `z`, and `extremum_kind` (`MINIMUM` or `MAXIMUM`). The legacy `type` field is `NONE`; an extremum's geometric type must not be mistaken for Push/Pull. Touch IDs remain per-frame and timestamps retain the backend's Unix-millisecond convention.

Generate Python bindings from the backend directory:

{% highlight shell linenos %}
python -m grpc_tools.protoc -I . --python_out=. --grpc_python_out=. --pyi_out=. \
  generated_services/interactionTypes.proto generated_services/interactionService.proto
{% endhighlight %}

The Docker build generates runtime bindings; the tracking-server build generates its C# bindings. Framework and backend must be upgraded together. New ReFlex clients reject an incompatible version during connection; v2 backends reject requests without valid raster metadata rather than guessing a 1D interpretation.

__[⬆ back to top](#table-of-contents)__

## Step 2: Sample and reconstruct in ReFlex

`RemoteDepthRaster` captures an immutable, request-local raster. Let `s = NumSkipValues+1`, with non-negative Skip. Sample original coordinates `(x*s,y*s)` starting at the origin, using `ceil(sensorWidth/s)` columns and `ceil(sensorHeight/s)` rows. Skip 1 therefore retains approximately one quarter of the samples.

With `CompleteDataSet=false`, invalid or filtered samples are represented by NaN **at their existing position**, not removed. Non-finite depths are always missing. With `true`, finite depths are included even if their validity/filter flag excludes them from normal processing. This replaces the old arbitrary compaction and its index mapping.

For returned index `i` and transmitted width `w`, reconstruct:

{% highlight text %}
sensorX = (i % w) * s
sensorY = (i / w) * s          # integer division
originalIndex = sensorY * sensorWidth + sensorX
{% endhighlight %}

Use the request's captured geometry, not mutable current settings. Validate bounds, finite returned depth and validity of the transmitted sample. Create a new `Point3(sensorX,sensorY,z)` for each accepted candidate: downstream observers use lateral array coordinates and modify depth, so reusing a pointcloud object would corrupt the source data.

`RemoteInteractionProcessor` passes its configured `Distance` as ZeroPlane. Before normalisation it discards candidates within `MinDistance` of that plane and classifies lower absolute depth as Push, higher depth as Pull. Normalisation and spatial classification precede smoothing, as in `MultiInteractionObserver`. Classification therefore uses the measured position rather than a position shifted by smoothing; the resulting extremum description is retained in the interaction history. Extremum-check settings persist when switching processors.

All detecting observers now inherit the same `Update()` pipeline: analysis, depth conversion, extremum classification, removal of intermediate extrema, smoothing, confidence filtering and publication. Remote candidates must therefore exceed `MinConfidence` before publication; repeated observations accumulate confidence, so a new touch can take several frames to appear. Rejected intermediate extrema never enter the history. The notebook still shows the Python candidates before these ReFlex filters. SingleTouch extracts one candidate per frame but may temporarily publish multiple historical touch IDs.

__[⬆ back to top](#table-of-contents)__

## Step 3: Extract spatial extrema in Python

Keep the processing stages separately testable in `service/interactionProcessingService.py`:

1. Validate raster dimensions (at least three per axis), sample count and positive step. Preserve an `isfinite` mask. All-missing input returns no candidates.
2. Fill missing positions from the nearest valid sample **for filtering only**. Never return a candidate on a missing position.
3. Design an order-5 Butterworth filter with `output="sos"`; apply `sosfiltfilt` along X, then Y. Effective sampling rate is `factor/sample_step`, so require `cutoff < factor/(2*sample_step)`. Limit padding for short axes.
4. Find local 2D minima and maxima using radius `max(1,ceil(10/sample_step))`, corresponding to ten original sensor pixels. Collapse connected plateaus to deterministic representatives; exclude the outer raster border.
5. Refine each candidate to an original-data extremum in its valid neighbourhood. Require contrast of at least `0.0005` against that neighbourhood's median, with the correct sign. Verify it remains a local extremum after refinement and deduplicate identical type/index pairs.
6. Return the original depth and geometric kind. Classification relative to ZeroPlane belongs to ReFlex.

This addresses three problems of the former flat-array detector: repeated intersections across image rows, incorrect Maximum=PULL/Minimum=PUSH assumptions, and filter overshoot projected onto an originally flat surface. A saddle is not a local 2D extremum; additional supported spatial extrema can still be legitimate candidates. SOS also avoids the numerical sensitivity of direct polynomial filter coefficients at very low cutoff ratios; see the [SciPy Butterworth documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.butter.html).

The new defaults are cutoff **2**, factor **100**. The previous 0.1/100 configuration nearly erased the recorded deformations when applied along both spatial axes. These settings describe spatial sampling, not camera frames per second. Excessive skip values can violate the Nyquist constraint even when `Configure` itself accepts the base parameters; the frame request then returns `INVALID_ARGUMENT`.

__[⬆ back to top](#table-of-contents)__

## Step 4: Observe the backend in two containers

The example adapter subclasses the existing processor and serialises each completed frame under the same lock as computation/configuration. Its atomic `latest.json` contains raster metadata, ZeroPlane, effective configuration, raw input, the actual SOS result and candidates. JSON uses `null` for missing values. Retain only the latest frame to avoid accumulating a rendering backlog; log snapshot-write errors without discarding successful extraction responses.

The multi-stage Dockerfile uses Python 3.10, installs the existing backend's pinned dependencies, and generates bindings. It converts a temporary copy of the UTF-16 requirements file to UTF-8 for pip. Both containers run as an unprivileged user. The backend target runs the adapter; the notebook target adds JupyterLab and Matplotlib.

Compose publishes only `127.0.0.1:50051` and `127.0.0.1:8888`. The notebook uses `backend:50051` inside the Compose network and mounts snapshots read-only. A separate notebook volume preserves edits. A health check verifies protocol-v2 readiness before Jupyter starts ([Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/)).

From the repository root:

{% highlight shell linenos %}
docker compose -f examples/grpc-service/compose.yaml up --build -d
docker compose -f examples/grpc-service/compose.yaml logs notebook
{% endhighlight %}

Open `http://localhost:8888/lab` with the logged token. Alternatively retrieve it with `docker compose -f examples/grpc-service/compose.yaml exec notebook jupyter server list`. Jupyter keeps its [default token authentication](https://jupyter-server.readthedocs.io/en/latest/operators/security.html).

Open `live-interactions.ipynb`, choose `demo` with ReFlex processing stopped, and run all cells. Three 2D views show masked input, SOS output and candidates over original depth. Marker shapes distinguish minima/maxima; colours illustrate depth sign relative to ZeroPlane. The notebook does not apply ReFlex's unknown-to-it `MinDistance` and therefore does not claim those colours are final accepted interactions. Coordinates refer to the transmitted raster; multiply by step for original sensor coordinates.

The live cell runs for 60 seconds and refreshes every half second. Rerun it to continue or interrupt the kernel to stop. Old frames are marked stale after three seconds. RPCs have a three-second deadline. Backend restart removes the previous snapshot. Snapshot JSON serialization adds per-frame overhead; this is a debugging example rather than a throughput benchmark.

__[⬆ back to top](#table-of-contents)__

## Step 5: Connect and upgrade ReFlex

1. Build both the updated tracking server and Docker images. Protocol-v1 peers are incompatible.
2. Set ReFlex's Processing view to `Remote`, Address `http://localhost`, Port `50051`.
3. Explicitly set **CutOff=2, Factor=100** in existing saved configurations and save if desired. Defaults are updated in code and the default settings template, but existing saved settings are not migrated. ReFlex sends filter configuration on each connection and propagates subsequent changes.
4. Choose Skip and Complete Data Set according to the rules above. Missing positions are retained, not compacted. Check dimensions and effective cutoff constraints after increasing Skip.
5. Stop any demo loop, set notebook `MODE="observe"`, rerun its cells, and enable sensor tracking and interaction processing. Observe mode does not configure the backend or submit frames.

Rebuilding an image does not replace an edited notebook in a named volume. Export edits, copy in the new bundled notebook and restart its kernel; exact commands are in the example README. This also refreshes imported protobuf bindings.

__[⬆ back to top](#table-of-contents)__

## Step 6: Verify the recorded scene and lifecycle

`services/python-backend/tests/fixtures/three-deformations.csv` is an unmodified capture of framework frame 3020: 640x480 samples with ZeroPlane 1.45. The JSON sidecar records capture time, original filter parameters, expected locations and SHA-256. The original depths span approximately 1.312 to 1.571.

The test checks two pushes near `(186,144)` and `(327,216)`, and one pull near `(220,269)`, with a three-pixel full-resolution tolerance. At Skip 1 and 3 the tolerance includes one sample step. Each deformation must have exactly one matching candidate. Additional candidates must be actual original-data-supported spatial extrema, rather than an assumed fixed number of intermediate saddle points.

Run the tests from the repository root:

{% highlight shell linenos %}
docker compose -f examples/grpc-service/compose.yaml exec backend python -m unittest discover -s /app/tests -v
docker compose -f examples/grpc-service/compose.yaml exec backend python -m unittest discover -s /app/example/tests -v
docker compose -f examples/grpc-service/compose.yaml exec notebook python /app/example/tests/check_notebook.py
dotnet test test/Library/InteractionTests/InteractionTests.csproj -c CI
{% endhighlight %}

The Python tests cover the capture, SOS stability, missing data, plateaus, saddles, short rasters and invalid requests. gRPC tests use a private listener to check version negotiation, snapshots and recovery after invalid requests. Notebook tests run demo and observe against a private test server; they never submit synthetic data to the live sensor service. C# tests cover sampling/reconstruction, non-divisible resolutions, request-local geometry, invalid responses, source-pointcloud preservation, reclassification and the dead zone.

| Manual check | Expected result |
| --- | --- |
| Demo | Two pushes and one pull, with spatially meaningful candidate locations. |
| Live sensor | Positions follow actual deformations; notebook remains an observer. |
| Stop processing | Last frame remains visible and becomes stale. |
| Restart backend | Old snapshot clears; frames resume after ReFlex reconnects. |
| Old protocol peer | Explicit incompatibility error, not silently misinterpreted arrays. |
| Invalid raster/filter settings | `INVALID_ARGUMENT`; a corrected request can succeed afterwards. |

Inspect backend logs for readiness/configuration errors. If ReFlex does not reconnect, stop and start its interaction processing. An occupied published port requires matching changes to the host-side address.

Stop with `docker compose -f examples/grpc-service/compose.yaml down`. Notebook edits persist. `down --volumes` deletes both snapshots and saved notebooks; export edits first. Subsequent startup populates a fresh notebook volume from the image.

__[⬆ back to top](#table-of-contents)__

## Further reading

* [gRPC/Jupyter template]({{ site.baseurl }}/software/templates/grpc-service.html).
* [Interaction processors]({{ site.baseurl }}/software/recipes/interaction-processor.html) and [processing pipeline]({{ site.baseurl }}/software/repo/pipeline.html).
* [Stream sensor data]({{ site.baseurl }}/software/recipes/stream-sensor-data.html) for a SignalR point-cloud viewer.
* Sources: `examples/grpc-service/`, `services/python-backend/`, and `tools/ReFlex.TrackingServer/Services/RemoteInteractionProcessingService.cs`.

__[⬆ back to top](#table-of-contents)__
