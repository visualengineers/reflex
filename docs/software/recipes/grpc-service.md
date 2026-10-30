---
title: "ReFlex Server: Create a gRPC service with live Jupyter visualisation"
---

# {{ page.title }}

<!-- omit in toc -->
## Table of Contents

1. [General approach](#general-approach)
2. [Step 1: Inspect the gRPC contract](#step-1-inspect-the-grpc-contract)
3. [Step 2: Reuse and observe the Python backend](#step-2-reuse-and-observe-the-python-backend)
4. [Step 3: Package two containers](#step-3-package-two-containers)
5. [Step 4: Start the notebook](#step-4-start-the-notebook)
6. [Step 5: Connect ReFlex](#step-5-connect-reflex)
7. [Step 6: Verify and extend the example](#step-6-verify-and-extend-the-example)
8. [Further reading](#further-reading)

## General approach

This recipe builds `examples/grpc-service/`: a Docker Compose example using the existing `services/python-backend/` to extract interactions and a separate JupyterLab container to visualise its work. It also includes synthetic input so that the service can be explored without a depth sensor. The documentation follows the implementation in the repository; the [template overview]({{ site.baseurl }}/software/templates/grpc-service.html) provides a shorter starting point.

The tracking server runs on the host with its sensor support. Its `RemoteInteractionProcessingService` is a **gRPC client**, calling the Python service. Jupyter is an observer of the Python service's input, intermediate filter output and response. It does not intercept the response or replace the tracking server.

```text
ReFlex tracking server (host)
    RemoteInteractionProcessingService
        | GetState / Configure / ComputeInteractions
        v
backend container :50051
    existing InteractionProcessingServicer
        | response: InteractionFrame -> ReFlex downstream processing
        | atomic latest.json: input + filter output + candidates
        v
shared frames volume (read-only for Jupyter)
        v
notebook container :8888 -> browser plots
```

In demo mode, the notebook submits synthetic depth arrays to the same gRPC endpoint instead of receiving real ReFlex input. Use only one producer at a time. This example observes processor input, not original camera frames; ReFlex filtering runs upstream. Its plots also do not represent the final calibrated interaction stream.

__[⬆ back to top](#table-of-contents)__

## Step 1: Inspect the gRPC contract

The service contract is defined in `tools/ReFlex.TrackingServer/Protos/interactionService.proto` and its Python counterpart in `services/python-backend/generated_services/`. Both use the `interactionService.InteractionProcessing` service name.

| RPC | Request | Response and purpose |
| --- | --- | --- |
| `GetState` | `StateRequest` | `StateResponse`: readiness and last frame ID; ReFlex uses this when connecting. |
| `Configure` | `ConfigRequest` | `ConfigResponse`: sets `cutoff` and `factor` for the Butterworth filter. |
| `ComputeInteractions` | `DepthValues1d` | `InteractionFrame`: frame ID and candidates with `point_idx`, `z`, `type`, `touch_id`, `time`. |

The C# client currently fills only the repeated `z` field. Although `DepthValues1d` also declares zero-plane and depth-range fields, the adapter does not send them. The Python processor filters the transmitted sequence and detects positive and negative peaks. It returns the **original** depth at each detected index, not the filtered amplitude.

`CompleteDataSet=true` sends every point's depth. With `false`, invalid/filtered points are removed and ReFlex stores an index mapping to reconstruct their original positions from the reply. Neither mode transfers image dimensions, X/Y coordinates or a validity mask. Use a one-dimensional plot unless you explicitly supply those missing metadata; do not infer a camera grid from array length alone.

Generate Python stubs during the image build, from the existing Python proto files:

{% highlight shell linenos %}
python -m grpc_tools.protoc -I . --python_out=. --grpc_python_out=. \
  generated_services/interactionTypes.proto generated_services/interactionService.proto
{% endhighlight %}

Run this in the backend's directory. Generated Python files are build artifacts rather than a second maintained implementation of the contract. If the framework protocol changes, update the Python proto definitions to match it before rebuilding.

__[⬆ back to top](#table-of-contents)__

## Step 2: Reuse and observe the Python backend

Create an adapter in `examples/grpc-service/backend.py` deriving from `InteractionProcessingServicer`. The implementation calls the existing `ComputeInteractions` and overrides `butter_lowpass_filtfilt` only to record the actual intermediate output:

{% highlight python linenos %}
def butter_lowpass_filtfilt(self, data, cutoff, fs, order=5):
    result = super().butter_lowpass_filtfilt(data, cutoff, fs, order)
    self.filtered = result.tolist()
    return result
{% endhighlight %}

The detector itself remains in `services/python-backend/service/interactionProcessingService.py`. Its order-5 Butterworth filter is followed by `scipy.signal.find_peaks` on both the signal and its negation, with prominence `0.0005`. Its sampling factor describes the flattened sequence, not necessarily the camera frame rate.

The adapter validates at least 19 finite samples (the filter's padding requirement) and finite settings satisfying `0 < cutoff < factor / 2`; invalid requests receive gRPC `INVALID_ARGUMENT`. A lock serialises configuration and computation so one snapshot contains matching input, filter parameters, intermediate values and interactions. The backend's `Configure` response must use `ConfigResponse(success=True)`: protobuf message fields require keyword arguments.

After processing, write a temporary JSON file and atomically replace `/data/latest.json`. Jupyter can then read a complete frame without blocking the gRPC response on rendering. Keep only the latest frame to avoid an ever-growing queue. A filesystem error is logged without discarding an otherwise successful extraction response. On startup the adapter removes a snapshot left by a previous run.

This observation step adds array conversion, JSON serialization and disk I/O per processed frame. It is intended for demonstrations and debugging. For higher throughput, consider sampling snapshots or a separate bounded telemetry transport. The original three-RPC interface is unchanged.

__[⬆ back to top](#table-of-contents)__

## Step 3: Package two containers

Create a multi-stage `Dockerfile` with a shared Python 3.10 base. Copy the existing backend, install its pinned requirements and generate its gRPC bindings. The repository's backend requirements file is UTF-16; the build converts a temporary copy to UTF-8 before passing it to pip. The source file remains unchanged.

The `backend` target runs the adapter. The `notebook` target additionally installs the versions in `notebook-requirements.txt`, copies `notebooks/live-interactions.ipynb` and starts JupyterLab. Both run as an unprivileged `reflex` user. The build context is the repository root so the existing backend can be copied directly; `Dockerfile.dockerignore` restricts the build input to the example and backend.

Create `compose.yaml` with:

* `backend`, publishing `127.0.0.1:50051:50051` and writing the `frames` volume.
* `notebook`, publishing `127.0.0.1:8888:8888`, reading `frames` at `/data:ro` and storing notebook edits in a separate `notebooks` volume.
* `GRPC_TARGET=backend:50051` in the notebook environment. `localhost` inside the notebook container would refer to that container itself.
* A backend health check calling `GetState` and `depends_on: backend: condition: service_healthy` for the notebook. Compose waits for readiness before starting the dependent service ([Docker startup-order documentation](https://docs.docker.com/compose/how-tos/startup-order/)).

The published addresses assume ReFlex and the browser run on the Docker host. The example uses plaintext local gRPC and leaves Jupyter token authentication enabled; it does not configure remote-machine access.

__[⬆ back to top](#table-of-contents)__

## Step 4: Start the notebook

Install Docker with its Compose plugin and start the Docker daemon. From the repository root:

{% highlight shell linenos %}
docker compose -f examples/grpc-service/compose.yaml up --build -d
docker compose -f examples/grpc-service/compose.yaml ps
docker compose -f examples/grpc-service/compose.yaml logs notebook
{% endhighlight %}

Open `http://localhost:8888/lab` and enter the token shown in the logs. You can also retrieve the running server's URL and token with:

{% highlight shell linenos %}
docker compose -f examples/grpc-service/compose.yaml exec notebook jupyter server list
{% endhighlight %}

This uses Jupyter's default token authentication; see the [Jupyter security documentation](https://jupyter-server.readthedocs.io/en/latest/operators/security.html).

Open `live-interactions.ipynb`. First try `MODE = "demo"` while ReFlex interaction processing is stopped, then run all cells. The notebook calls `GetState`, configures cutoff `2` and factor `100`, and sends a moving sinusoidal depth profile with higher-frequency noise through `ComputeInteractions`.

The live cell displays three vertically aligned plots: transmitted input, actual low-pass output, and detected Push/Pull candidates over the original signal. It also shows the frame ID, effective parameters, age and candidate details. It reads snapshots every half second for 60 seconds; rerun that cell to continue, or interrupt the kernel to stop early. RPCs have a three-second deadline. Observe mode waits when no snapshot exists, and marks old snapshots stale after three seconds.

__[⬆ back to top](#table-of-contents)__

## Step 5: Connect ReFlex

1. Stop the demo loop. If demo mode was used, restart the backend to reset its filter configuration: `docker compose -f examples/grpc-service/compose.yaml restart backend`.
2. Set `MODE = "observe"` and rerun the notebook cells. This mode calls `GetState` but does not send frames or change settings.
3. Start the ReFlex tracking server and its sensor. In the Processing view select `Remote` as the interaction processor.
4. Set Address to `http://localhost` and Port to `50051`. Together these identify the published gRPC service. This is separate from the tracking server's REST/SignalR port.
5. Choose `Complete Data Set` according to the input. Enable it only if all depths are finite; otherwise disable it to omit invalid/filtered points. At least 19 transmitted values must remain. Compacted indices remain valid for the notebook's plots and ReFlex reconstructs the original indices from its mapping.
6. Start interaction processing. After connection, apply the desired CutOff/Factor settings in the Processing view and verify the effective values in the notebook. Save the settings if they should persist in ReFlex.

The Python backend initially uses cutoff `0.1` and factor `100`, while ReFlex's settings class defaults to factor `1200`. Connecting through `GetState` does not itself send a `Configure` request. Treat the parameters shown in the snapshot as authoritative; selecting a value in the UI before connecting does not guarantee it reached the backend. If necessary, change and apply a valid cutoff while connected to trigger configuration delivery.

The Python response is still a set of candidates. ReFlex subsequently performs depth conversion, extremum classification, tracking and calibration. The existing Python implementation assigns IDs within each frame and uses Unix milliseconds for its timestamps, whereas the C# interaction model normally uses .NET ticks. This example preserves that behaviour and makes no claim of persistent Python touch identities or final framework output.

__[⬆ back to top](#table-of-contents)__

## Step 6: Verify and extend the example

Run the integration tests against the built backend image:

{% highlight shell linenos %}
docker compose -f examples/grpc-service/compose.yaml exec backend \
  python -m unittest discover -s /app/example/tests -v
{% endhighlight %}

The tests start an isolated real gRPC listener, check readiness and configuration, compare candidate results with the existing processor, compare the captured filter output, verify latest-frame replacement and reject invalid data/settings before accepting a valid request again.

Verify the complete workflow manually:

| Check | Expected result |
| --- | --- |
| Run demo mode | Frame IDs advance; filtered profiles and both extrema types appear. |
| Switch to ReFlex with demo stopped | Frames reflect sensor changes; no synthetic producer overwrites them. |
| Stop ReFlex processing | The last frame remains visible and becomes stale. |
| Restart backend | Snapshot clears; observe mode waits, then resumes when ReFlex reconnects and submits new frames. |
| Stop the notebook loop | Kernel interrupt returns control without stopping backend extraction. |
| Save notebook, stop and start Compose | Saved edits persist in the notebook volume. |

If Docker cannot connect to its daemon, start Docker before rerunning Compose. If the service is unhealthy, inspect `docker compose -f examples/grpc-service/compose.yaml logs backend`. An occupied port requires changing the published port and matching host-side connection settings. For `INVALID_ARGUMENT`, inspect sample count, non-finite depths and filter settings. Connected without frames usually means the sensor or interaction processing is stopped. If ReFlex does not reconnect after a backend restart, stop and start its interaction processing.

Stop the containers while preserving notebook edits:

{% highlight shell linenos %}
docker compose -f examples/grpc-service/compose.yaml down
{% endhighlight %}

The named notebook volume also preserves the old notebook after an image rebuild. Export edits using `docker compose ... cp` as shown in the example README before resetting it. `down --volumes` deletes both saved notebook edits and snapshots; a subsequent start copies the bundled notebook into a new volume.

To explore another intermediate processing step, capture it in the adapter, add a field to the snapshot and add a notebook plot. Keep the snapshot bound to the same request and document units and indices. To replace the algorithm itself, edit the backend implementation and rebuild the image, retaining the gRPC response contract expected by ReFlex.

__[⬆ back to top](#table-of-contents)__

## Further reading

* [gRPC/Jupyter template]({{ site.baseurl }}/software/templates/grpc-service.html).
* [Implement an interaction processor]({{ site.baseurl }}/software/recipes/interaction-processor.html) and [processing pipeline]({{ site.baseurl }}/software/repo/pipeline.html).
* [Stream sensor data]({{ site.baseurl }}/software/recipes/stream-sensor-data.html) for a SignalR view of point-cloud data.
* Repository sources: `examples/grpc-service/`, `services/python-backend/`, and `tools/ReFlex.TrackingServer/Services/RemoteInteractionProcessingService.cs`.

__[⬆ back to top](#table-of-contents)__
