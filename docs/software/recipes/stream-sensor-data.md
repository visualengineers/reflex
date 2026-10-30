---
title: "ReFlex Client: Stream sensor data in a web application"
---

# {{ page.title }}

<!-- omit in toc -->
## Table of contents

1. [Choose the data stream](#choose-the-data-stream)
2. [Prepare the Angular application](#prepare-the-angular-application)
3. [Connect and track connection state](#connect-and-track-connection-state)
4. [Draw a basic point-cloud preview](#draw-a-basic-point-cloud-preview)
5. [Receive depth images](#receive-depth-images)
6. [Extend the server with vector-field streaming](#extend-the-server-with-vector-field-streaming)
7. [Test setup](#test-setup)
8. [Further reading](#further-reading)

## Choose the data stream

This recipe uses the current `tools/ReFlex.TrackingServer` implementation and the Angular base application in `examples/basic-angular`. It follows the separation used in [ReFlex Layers]({{ site.baseurl }}/software/apps/layers.html): a connection owns the data stream, while components consume data and render it.

**The transports differ:** Layers' `PointCloudService` uses SignalR; `PointCloudImageService` extends `StreamImageService`, which uses a native WebSocket and a REST request to enable image streaming. Those image endpoints are not SignalR hubs. Here, “streaming” means successive server events, not SignalR's `connection.stream()` API.

| Data | Transport / endpoint | Start and receive | Stop |
| ---- | -------------------- | ----------------- | ---- |
| Filtered point cloud | SignalR `/pointcloudhub` | Invoke `startPointCloud`; handle `pointCloud` (`Point3[]`) | Invoke `stopPointCloud`, or close the connection |
| Raw depth preview | WebSocket `/depthImage` | PUT JSON `true` to `/api/Tracking/SetDepthImagePreview`; send a text message to request each frame | Close the socket; see the shared enable flags below |
| Filtered point-cloud depth preview | WebSocket `/depthImagePointCloud` | PUT JSON `true` to `/api/Tracking/SetDepthImagePointCloudPreview`; same frame request protocol | Close the socket |
| Vector field | Requires a server extension | The current `PointCloudHub` has no `startVectorField` method; see the extension below | Add matching subscription cleanup |

The point-cloud payload uses camel-case properties `x`, `y`, `z`, `isValid`, `isFiltered` (the `Point3` interface in `@reflex/shared-types`). These are sensor-space coordinates, not calibrated interaction coordinates in [0, 1]. Use the sensor's units and filter settings when choosing display bounds. The server samples and may reduce the array according to `PointCloudSettingValues.UpdateInterval`, `PointCloudSize` and `FullResolution`. Do not infer a rectangular image or camera resolution from this array's length.

Image messages are JPEG data URLs (`data:image/jpeg;base64,...`), not numeric depth arrays. The filtered preview maps Z through `DepthImageService.MinZ` and `RangeZ` into grayscale; invalid/filtered samples become gray (127). JPEG is suitable for a preview or texture, but not lossless depth measurements. Point-cloud, image and interaction messages have no shared frame identifier in this API: receiving them together does not guarantee frame synchronisation.

__[⬆ back to top](#table-of-contents)__

## Prepare the Angular application

From the repository root, install the workspace dependencies and declare the SignalR dependency in the example workspace. The version below matches the TrackingServer client in this repository:

{% highlight shell %}
npm ci
npm install @microsoft/signalr@6.0.1 -w examples/basic-angular
npm run build:shared-types
npm run start:example-angular
{% endhighlight %}

The example runs at `http://localhost:4201`. Start the TrackingServer using its [development setup]({{ site.baseurl }}/software/apps/server.html) and select and start a sensor (or the emulator). Use the HTTP(S) address printed by that server, for example `http://localhost:5000`; the packaged application commonly uses port `8000`. Opening the hub does not start a camera or enable processing.

For local cross-origin development, `Startup.cs` currently permits origins whose host is `localhost`. `127.0.0.1`, a LAN hostname and a deployed application's origin need an explicit server CORS configuration. Use an HTTP(S) URL for SignalR's `withUrl`; it handles negotiation and transport selection. A page served over HTTPS also needs HTTPS for SignalR/REST and WSS for native WebSockets, with a trusted certificate or an appropriate reverse proxy.

__[⬆ back to top](#table-of-contents)__

## Connect and track connection state

Create `src/app/sensor-stream.ts`. This small client is independent of Angular dependency injection so that it can also be tested with a fake connection. One component owns one instance; several views should share one owner rather than start duplicate subscriptions.

{% highlight typescript linenos %}
import { BehaviorSubject, Subject } from 'rxjs';
import { HubConnection, HubConnectionBuilder, HubConnectionState,
  LogLevel } from '@microsoft/signalr';
import { Point3 } from '@reflex/shared-types';

export class SensorStream {
  readonly state$ = new BehaviorSubject(HubConnectionState.Disconnected);
  readonly ready$ = new BehaviorSubject(false);
  readonly error$ = new BehaviorSubject('');
  readonly points$ = new Subject<Point3[]>();
  readonly lastFrameAt$ = new BehaviorSubject<number | null>(null);
  private disposed = false;
  private busy = false;
  private readonly receive = (points: Point3[]) => {
    if (this.disposed) return;
    if (!Array.isArray(points)) {
      this.error$.next('Invalid point-cloud payload');
      return;
    }
    this.lastFrameAt$.next(Date.now());
    this.points$.next(points);
  };

  constructor(private readonly hub: HubConnection) {
    // Register once, before start(), including on subsequent reconnects.
    hub.on('pointCloud', this.receive);
    hub.onreconnecting(error => {
      if (this.disposed) return;
      this.ready$.next(false);
      this.state$.next(HubConnectionState.Reconnecting);
      this.error$.next(error?.message ?? 'Connection lost');
    });
    hub.onreconnected(() => {
      if (this.disposed) return;
      this.state$.next(HubConnectionState.Connected);
      // Reconnection creates a new server connection: subscribe again.
      void this.subscribe();
    });
    hub.onclose(error => {
      if (this.disposed) return;
      this.ready$.next(false);
      this.state$.next(HubConnectionState.Disconnected);
      this.error$.next(error?.message ?? 'Connection closed; press Retry');
    });
  }

  async connect(): Promise<void> {
    if (this.disposed || this.busy || this.ready$.value) return;
    if (this.hub.state === HubConnectionState.Reconnecting ||
        this.hub.state === HubConnectionState.Disconnecting) return;
    this.busy = true;
    this.error$.next('');
    try {
      if (this.hub.state === HubConnectionState.Disconnected) {
        this.state$.next(HubConnectionState.Connecting);
        await this.hub.start();
      }
      if (this.disposed) return;
      this.state$.next(this.hub.state);
      await this.subscribe();
    } catch (error) {
      if (!this.disposed) {
        this.state$.next(this.hub.state);
        this.error$.next(String(error));
      }
    } finally {
      this.busy = false;
    }
  }

  private async subscribe(): Promise<void> {
    try {
      // invoke observes server-side subscription failures, unlike send.
      await this.hub.invoke('startPointCloud');
      if (!this.disposed && this.hub.state === HubConnectionState.Connected) {
        this.ready$.next(true);
        this.error$.next('');
      }
    } catch (error) {
      if (!this.disposed) {
        this.ready$.next(false);
        this.error$.next(`Subscription failed: ${String(error)}`);
      }
    }
  }

  async dispose(): Promise<void> {
    this.disposed = true; // Also prevents late callbacks from updating the UI.
    this.hub.off('pointCloud', this.receive);
    try {
      // The server's OnDisconnectedAsync calls StopPointCloud.
      // stop() also cancels automatic reconnect / a pending start.
      await this.hub.stop();
    } catch (error) {
      console.error('Stopping sensor stream failed', error);
    } finally {
      this.ready$.next(false);
      this.state$.next(HubConnectionState.Disconnected);
      this.points$.complete();
      this.state$.complete();
      this.ready$.complete();
      this.error$.complete();
      this.lastFrameAt$.complete();
    }
  }
}

export function createSensorStream(serverUrl: string): SensorStream {
  const hub = new HubConnectionBuilder()
    .withUrl(`${serverUrl.replace(/\/$/, '')}/pointcloudhub`)
    .withAutomaticReconnect([0, 2000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();
  return new SensorStream(hub);
}
{% endhighlight %}

The UI distinguishes **transport state**, **successful subscription** (`ready$`) and **last received frame**. A connected hub with a stopped camera can legitimately produce no frames. Display the last-frame timestamp (and optionally a stale-data indicator) instead of treating `Connected` as proof of sensor activity.

Automatic reconnect retries established connections with the configured delays. It does not retry an initial `start()` failure. This recipe deliberately uses a Retry button both for initial failures and after reconnect attempts are exhausted; `connect()` also retries a failed subscription on an already connected hub. See Microsoft's [SignalR JavaScript client documentation](https://learn.microsoft.com/en-us/aspnet/core/signalr/javascript-client?view=aspnetcore-8.0#reconnect-clients). If unattended recovery is needed, add a bounded backoff timer around `connect()`, cancel it during disposal, and avoid running it while SignalR is reconnecting.

Use `invoke('stopPointCloud')` to pause streaming while retaining the hub connection, and `invoke('startPointCloud')` to resume. Update the application's readiness state accordingly. For complete teardown, the example closes its dedicated connection. Do not add new event handlers on each reconnect: that would render every frame more than once.

__[⬆ back to top](#table-of-contents)__

## Draw a basic point-cloud preview

Create `src/app/sensor-preview.component.ts`. This is an orthographic X/Y scatter plot, coloured by Z, not a calibrated depth image or a full 3D viewer. The fixed bounds are illustrative; adjust them to the selected sensor. Keeping the bounds fixed avoids a moving scale between frames.

{% highlight typescript linenos %}
{% raw %}
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild }
  from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { Point3 } from '@reflex/shared-types';
import { createSensorStream } from './sensor-stream';

@Component({
  selector: 'app-sensor-preview',
  standalone: true,
  imports: [AsyncPipe, DatePipe],
  template: `
    <p>Connection: {{ stream.state$ | async }};
       subscribed: {{ stream.ready$ | async }}</p>
    <p>Last frame: {{ (stream.lastFrameAt$ | async) | date:'mediumTime' }}</p>
    <p role="status">{{ stream.error$ | async }}</p>
    <button (click)="stream.connect()">Connect / Retry</button>
    <canvas #canvas width="640" height="480"
      aria-label="Point cloud, X/Y projection"></canvas>
  `
})
export class SensorPreviewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  readonly stream = createSensorStream('http://localhost:5000');
  private subscription?: Subscription;
  private pending?: number;
  private latest: Point3[] = [];

  ngAfterViewInit(): void {
    this.subscription = this.stream.points$.subscribe(points => {
      this.latest = points; // Keep only the newest frame, no rendering queue.
      if (this.pending !== undefined) return;
      this.pending = requestAnimationFrame(() => {
        this.pending = undefined;
        this.draw(this.latest);
      });
    });
    void this.stream.connect();
  }

  private draw(points: Point3[]): void {
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    const xMin = -1, xMax = 1, yMin = -1, yMax = 1;
    const zMin = 0.5, zMax = 1.5;
    ctx.fillStyle = '#101820';
    ctx.fillRect(0, 0, width, height);
    const step = Math.max(1, Math.ceil(points.length / 10000));
    for (let i = 0; i < points.length; i += step) {
      const p = points[i];
      if (!p || !p.isValid || p.isFiltered ||
          ![p.x, p.y, p.z].every(Number.isFinite)) continue;
      const x = (p.x - xMin) / (xMax - xMin) * (width - 1);
      const y = (1 - (p.y - yMin) / (yMax - yMin)) * (height - 1);
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      const depth = Math.max(0, Math.min(1, (p.z - zMin) / (zMax - zMin)));
      ctx.fillStyle = `hsl(${240 * (1 - depth)}, 90%, 60%)`;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    if (this.pending !== undefined) cancelAnimationFrame(this.pending);
    void this.stream.dispose();
  }
}
{% endraw %}
{% endhighlight %}

Add `SensorPreviewComponent` to the **imports** of `AppModule` in the base application (it is standalone), then place `<app-sensor-preview></app-sensor-preview>` in `app.component.html`. Existing touch visualisation can remain beside it. The last preview remains visible during an outage; its timestamp and connection status identify it as stale. For larger clouds, use a GPU point renderer and keep the same connection lifecycle.

__[⬆ back to top](#table-of-contents)__

## Receive depth images

For an image-only view, use the existing WebSocket protocol rather than constructing a `HubConnection` for an image URL. The following helper mirrors the REST-enable / request-next-frame sequence in Layers' `PointCloudImageService` and `StreamImageService`:

{% highlight typescript linenos %}
export async function openDepthPreview(
  serverUrl: string,
  image: HTMLImageElement,
  onState: (state: string) => void,
  onError: (message: string) => void,
  filtered = true
): Promise<() => void> {
  const base = serverUrl.replace(/\/$/, '');
  const route = filtered ? 'SetDepthImagePointCloudPreview' : 'SetDepthImagePreview';
  const response = await fetch(`${base}/api/Tracking/${route}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: 'true'
  });
  // The endpoint returns 202 with no JSON body.
  if (!response.ok) throw new Error(`Enable preview: HTTP ${response.status}`);
  const url = new URL(filtered ? '/depthImagePointCloud' : '/depthImage', base);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(url);
  let stopped = false;
  onState('connecting');
  const next = () => {
    if (!stopped && socket.readyState === WebSocket.OPEN) socket.send('continue');
  };
  image.onload = next; // Backpressure: request only after decoding/displaying.
  image.onerror = () => { onError('Cannot decode depth preview'); next(); };
  socket.onopen = () => { onState('connected'); socket.send('Start'); };
  socket.onmessage = event => {
    if (stopped) return;
    if (typeof event.data !== 'string' ||
        !event.data.startsWith('data:image/jpeg;base64,')) {
      onError('Invalid or empty depth preview');
      next();
      return;
    }
    image.src = event.data;
  };
  socket.onerror = () => onError('Depth WebSocket failed; inspect browser network log');
  socket.onclose = () => onState('disconnected');
  return () => {
    stopped = true;
    image.onload = null;
    image.onerror = null;
    socket.close();
  };
}
{% endhighlight %}

Call this helper with an `<img>` element, retain its returned cleanup function and call it on component destruction. Catch the returned promise's rejection to display REST failures. If the component is destroyed while the enable request is pending, invoke cleanup immediately when that promise resolves. The example assumes the server endpoints are hosted at the origin root; adjust both URL paths when using a proxy path prefix.

Native WebSockets do not inherit SignalR's retry policy. After `onclose`, offer Retry, or schedule a bounded backoff that first cleans up the previous socket and re-runs the helper (including the enable request after a server restart). Cancel that timer on destruction, allow only one opening attempt at a time and expose the last-image timestamp separately from the socket state. An open socket can still be waiting for an inactive sensor.

The server waits for a client message **before the first image and after each image**; without `Start` / `continue`, the preview stalls. The message text itself is not parsed by the current server; a text message selects text responses. These messages are neither JSON objects nor SignalR messages.

The REST enable flags are shared server state, not per-client subscriptions. Do not send `false` automatically when closing one of several viewers. In an exclusively owned test setup, the corresponding PUT with JSON `false` can reset the flag, but the current service uses `SkipWhile`, not a continuous enable filter: this does not reliably stop an already active stream. Close the socket to stop that client's reception.

If a project requires **all three representations over SignalR**, implement an image publisher/hub contract as an explicit server extension, reusing `StreamDataConverter` for encoding and per-connection start/stop groups. Add frame metadata and a bounded update rate. The existing WebSocket URLs cannot be used with `connection.on()` or `connection.stream()`.

__[⬆ back to top](#table-of-contents)__

## Extend the server with vector-field streaming

The [SignalR overview]({{ site.baseurl }}/software/apps/server/signal-r.html) lists `startVectorField`, but the current `Hubs/PointCloudHub.cs` implements only point-cloud subscriptions. Calling the vector-field method on this version fails; adding a client handler alone cannot enable it.

For a server extension, follow `Model/PointCloudService.cs`:

1. Create a singleton publisher consuming `IDepthImageManager.VectorfieldChanged` (`VectorField2`). Sample at a configurable interval and copy the selected values into an immutable transfer object before asynchronous sending. The processing pipeline reuses mutable field data.
2. Define a wire contract, for example `{ width, height, stride, vectors: [{ x, y }, ...] }`. Explicitly flatten `field[x, y]` with `y` as the outer loop and `x` as the inner loop, so index `y * width + x` is unambiguous. Include dimensions and `Stride`; do not infer them from a reduced point cloud. Define how invalid vectors are represented.
3. Add `StartVectorField()` and `StopVectorField()` to the hub, using a separate `VectorField` group and per-connection subscription bookkeeping. Make repeated starts idempotent and remove the subscription in `OnDisconnectedAsync`, alongside `StopPointCloud()`. Register the publisher in `Startup.ConfigureServices`.
4. Publish the DTO with `IHubContext<PointCloudHub>.Clients.Group("VectorField").SendAsync("vectorField", dto)`. Share the upstream event subscription; do not broadcast the same frame once per connected client. Bound outstanding sends so a slow client cannot create an unbounded queue.
5. Add the following handler before connecting, and invoke `startVectorField` after every successful connection/reconnection. Track its subscription result independently from point-cloud readiness. Invoke `stopVectorField` when pausing the field, and remove the handler during teardown.

{% highlight typescript %}
// Proposed contract for the extension; not an existing server payload.
interface VectorFrame {
  width: number;
  height: number;
  stride: number;
  vectors: Array<{ x: number; y: number } | null>;
}
const receiveVectors = (frame: VectorFrame) => {
  // Validate dimensions/length, then draw arrows on the field grid.
  // null represents an invalid sample in this proposed contract.
  console.log(frame.width, frame.height, frame.stride);
};
// hub.on('vectorField', receiveVectors);       // before hub.start()
// await hub.invoke('startVectorField');       // also after reconnect
// await hub.invoke('stopVectorField');        // pause
// hub.off('vectorField', receiveVectors);     // teardown
{% endhighlight %}

Enable processing that actually computes the vector field before testing this extension. A point-cloud frame alone is not proof of a vector-field update. For a new protocol requiring synchronised clouds, fields and images, include a common source frame ID and timestamp in all three contracts.

__[⬆ back to top](#table-of-contents)__

## Test setup

### Local integration test

1. Start the TrackingServer and the [emulator]({{ site.baseurl }}/software/apps/emulator.html) (`npm run start:emulator` from the repository root). Configure the emulator's server address, select its camera in the server and start tracking/processing. A physical supported depth camera is an alternative. Use a repeatable deformation pattern or a recorded stream.
2. Start `basic-angular` at `http://localhost:4201`, set the backend URL in the component and open the preview. In browser developer tools, check the `/pointcloudhub/negotiate` request and subsequent transport connection. Expect `Connected`, `subscribed: true`, changing timestamps and coloured points. Adjust bounds if valid points fall outside the canvas.
3. For image testing, attach the helper to a separate `<img>` and status display. Expect a successful PUT, a WebSocket upgrade, an initial outbound text message and successive JPEG data URLs / `continue` messages. Test both values of `filtered`.

| Exercise | Expected result |
| -------- | --------------- |
| Load with server stopped | Error visible; no unhandled rejection; start server and press Retry |
| Stop/restart server during streaming | Reconnecting state, then a fresh subscription and new frames; after retry exhaustion, Disconnected with manual Retry |
| Camera stopped, hub still connected | Connected/subscribed, but timestamp stops advancing; diagnose camera/processing rather than reconnecting forever |
| Subscription method fails | Error visible even though transport can remain connected; Retry re-invokes the subscription |
| Navigate away while connecting or reconnecting | No remaining frame handler, rendering callback or reconnect after disposal |
| Open two viewers, close one | Remaining viewer continues; no shared image flag disabled by the closing viewer |
| Empty cloud / invalid or filtered points | Canvas clears; invalid samples are skipped; no exception |
| Reconnect repeatedly | One local frame delivery per received event; no accumulated handlers |
| Slow image decoding | At most one requested image awaiting decode; no growing image queue |
| Unextended server: invoke `startVectorField` | Method error, not a misleading “stream started” indicator |
| Extended vector publisher | Correct dimensions/order/stride, restart recovery and subscriber cleanup |

For CORS/negotiation errors check the requested origin, backend address, certificate and proxy WebSocket support. A 404 usually indicates an incorrect hub/path or a different server version. Do not log every large frame; log lifecycle transitions and use frame counts/timestamps for diagnostics.

### Automated client checks

The client accepts a `HubConnection`, so Jasmine tests can supply a fake without a camera or network. Create `src/app/sensor-stream.spec.ts` in the Angular example:

{% highlight typescript linenos %}
import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import { SensorStream } from './sensor-stream';

it('resubscribes after reconnect and removes its handler on disposal', async () => {
  let reconnected: () => void = () => {};
  let receive: (...args: any[]) => void = () => {};
  const hub = {
    state: HubConnectionState.Disconnected,
    on: jasmine.createSpy('on').and.callFake((_name, handler) => { receive = handler; }),
    off: jasmine.createSpy('off'),
    onreconnecting: () => {},
    onreconnected: (handler: () => void) => { reconnected = handler; },
    onclose: () => {},
    start: async () => { hub.state = HubConnectionState.Connected; },
    stop: jasmine.createSpy('stop').and.resolveTo(),
    invoke: jasmine.createSpy('invoke').and.resolveTo()
  };
  const stream = new SensorStream(hub as unknown as HubConnection);
  let frames = 0;
  stream.points$.subscribe(() => frames++);
  await stream.connect();
  expect(stream.ready$.value).toBeTrue();
  reconnected();
  await Promise.resolve();
  expect(hub.invoke.calls.allArgs()).toEqual([
    ['startPointCloud'], ['startPointCloud']
  ]);
  receive([]);
  expect(frames).toBe(1);
  await stream.dispose();
  expect(hub.off).toHaveBeenCalledWith('pointCloud', receive);
  expect(hub.stop).toHaveBeenCalled();
  receive([]); // Late delivery must not reach the view.
  expect(frames).toBe(1);
});
{% endhighlight %}

Run `npm run test-ci -w examples/basic-angular` (requires the configured browser test runner) and `npm run build:example-angular`. Extend the fake with rejected `start`/`invoke` promises, captured reconnect/close callbacks and a delayed `start()` to cover the failure and disposal cases in the table. Test the image helper separately with a mocked fetch and WebSocket: check the PUT body, initial request, no next request before image load, and cleanup. These unit checks complement the real-server integration test; they do not verify the wire protocol or sensor drivers.

__[⬆ back to top](#table-of-contents)__

## Further reading

* [Angular base application]({{ site.baseurl }}/software/templates/angular.html) and [server SignalR interface]({{ site.baseurl }}/software/apps/server/signal-r.html).
* [Layers application]({{ site.baseurl }}/software/apps/layers.html) and [Layers case study]({{ site.baseurl }}/knowledge/case-studies/layers.html).
* Source in this repository: `tools/ReFlex.TrackingServer/Hubs/PointCloudHub.cs`, `Model/PointCloudService.cs`, `Services/DepthImageService.cs`, `Util/DepthImageWebsocket.cs`, and `Controllers/TrackingController.cs` (the latter paths are relative to `tools/ReFlex.TrackingServer`).
* Source in the companion `reflex-layers` repository: `src/services/point-cloud.service.ts`, `point-cloud-image.service.ts`, `stream-image.service.ts`, and `websocket.service.base.ts`.

__[⬆ back to top](#table-of-contents)__
