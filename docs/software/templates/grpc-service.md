# Template: gRPC and Jupyter

<!-- omit in toc -->
## Table of contents

1. [Basic example](#basic-example)
2. [Setup and configuration](#setup-and-configuration)
3. [Live visualisation](#live-visualisation)

## Basic example

* location: `examples/grpc-service/`
* technology: Python, gRPC protocol v2, SciPy, JupyterLab, Matplotlib and Docker Compose
* ReFlex endpoint on the host: `http://localhost:50051`
* notebook frontend: `http://localhost:8888/lab` (token from container logs)
* two containers: Python backend with an observation adapter, and JupyterLab
* optional synthetic 2D input with two pushes and one pull

ReFlex acts as the gRPC client and the Python backend as its server. The backend extracts geometric 2D extrema using SOS filtering and original-depth validation. ReFlex reconstructs sensor indices and determines Push/Pull relative to its ZeroPlane, before applying its existing dead zone and further processing. Read the [gRPC service recipe]({{ site.baseurl }}/software/recipes/grpc-service.html) for implementation details.

__[⬆ back to top](#table-of-contents)__

## Setup and configuration

With Docker running, execute from the repository root:

{% highlight shell linenos %}
docker compose -f examples/grpc-service/compose.yaml up --build -d
docker compose -f examples/grpc-service/compose.yaml logs notebook
{% endhighlight %}

Open `http://localhost:8888/lab`, enter the logged token and open `live-interactions.ipynb`. Choose `MODE = "demo"` with ReFlex processing stopped, or leave `MODE = "observe"` and enable ReFlex's Remote processor at `http://localhost:50051`. Run all cells.

Upgrade the framework and backend together: version 2 requires raster dimensions and sample step. Set **CutOff=2, Factor=100** explicitly in existing saved configurations; defaults do not overwrite saved values. ReFlex applies filter settings when connecting.

Skip applies to both axes: `NumSkipValues=1` keeps every second row and column. Disabled `Complete Data Set` preserves invalid/filtered positions as missing values. Effective sampling rate is `Factor / (NumSkipValues+1)`; CutOff must be below half that rate.

The notebook uses `backend:50051` inside Compose. The backend health check verifies protocol-v2 readiness before Jupyter starts. Existing notebook volumes retain old files on rebuild: export your edits and replace the bundled notebook as described in the example README, then restart its kernel.

__[⬆ back to top](#table-of-contents)__

## Live visualisation

Three 2D plots show input, the actual separable SOS result and candidates over original depth. Missing positions are masked. Marker shapes identify minima/maxima; colours illustrate depth relative to ZeroPlane, without applying ReFlex's dead zone. These are candidates, not final tracked/calibrated interactions.

Plot coordinates refer to the transmitted raster. Multiply by `sample_step` to obtain sensor coordinates. Updates run every half second for 60 seconds; interrupt the kernel to stop early or rerun the live cell. Old frames become stale, and a backend restart clears the snapshot.

The backend regression test replays a recorded 640x480 frame containing two pushes and one pull at Skip 0/1/3. Separate gRPC and notebook checks use private test servers. See the README for commands.

Stop with `docker compose -f examples/grpc-service/compose.yaml down`. Saved notebooks persist; `down --volumes` deletes them.

__[⬆ back to top](#table-of-contents)__
