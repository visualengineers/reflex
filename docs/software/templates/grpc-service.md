# Template: gRPC and Jupyter

<!-- omit in toc -->
## Table of contents

1. [Basic example](#basic-example)
2. [Setup and configuration](#setup-and-configuration)
3. [Live visualisation](#live-visualisation)

## Basic example

* location: `examples/grpc-service/`
* technology: Python, gRPC, SciPy, JupyterLab, Matplotlib and Docker Compose
* ReFlex endpoint on the host: `http://localhost:50051`
* notebook frontend: `http://localhost:8888/lab` (token from container logs)
* two containers: existing Python backend with an observation adapter, and JupyterLab
* optional synthetic input for trying the example without a sensor

The example demonstrates remote interaction extraction, unlike the websocket clients which consume final interactions. ReFlex acts as the gRPC client; the Python backend is the gRPC server. The notebook displays transmitted depth values, the actual low-pass filter output and returned candidates. Read the [gRPC service recipe]({{ site.baseurl }}/software/recipes/grpc-service.html) for the implementation steps and protocol limitations.

__[⬆ back to top](#table-of-contents)__

## Setup and configuration

With Docker running, execute from the repository root:

{% highlight shell linenos %}
docker compose -f examples/grpc-service/compose.yaml up --build -d
docker compose -f examples/grpc-service/compose.yaml logs notebook
{% endhighlight %}

Open `http://localhost:8888/lab`, enter the logged token, then open `live-interactions.ipynb`. Run all cells. Choose `MODE = "demo"` for synthetic data while ReFlex processing is stopped, or leave `MODE = "observe"` and enable ReFlex's Remote processor at `http://localhost:50051` with a running sensor. Demo mode changes the backend filter settings; restart the backend before switching back to real sensor input and check the effective settings in the plot.

Both exposed ports are restricted to the local machine. The notebook connects to `backend:50051` within the Compose network. A health check ensures the backend answers `GetState` before Jupyter starts.

__[⬆ back to top](#table-of-contents)__

## Live visualisation

The live cell refreshes every half second for 60 seconds. Interrupt the kernel to stop it early, or rerun the cell to continue. The frame number, age, filter settings and candidate details accompany three plots. Without incoming frames it waits; an old frame is marked stale. Only the latest complete snapshot is retained.

The horizontal axis is the transmitted array index. The gRPC request has no grid dimensions or validity flags, so the notebook cannot reconstruct a camera image. ReFlex preprocessing may already have altered the data. Returned candidates have not yet passed ReFlex's downstream tracking and calibration.

Stop with `docker compose -f examples/grpc-service/compose.yaml down`. Saved notebook edits persist in a named volume; `down --volumes` deletes them. Export edits before resetting volumes. See the example README for export commands and integration tests.

__[⬆ back to top](#table-of-contents)__
