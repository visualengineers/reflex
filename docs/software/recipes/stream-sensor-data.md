---
title: "ReFlex Client: Stream sensor data with SignalR"
---

# {{ page.title }}

<!-- omit in toc -->
## Table of Contents

1. [Step 1: Prepare server and client](#step-1-prepare-server-and-client)
2. [Step 2: Connect and activate the stream](#step-2-connect-and-activate-the-stream)
3. [Step 3: Use the service in Angular](#step-3-use-the-service-in-angular)
4. [Step 4: Visualise the point cloud](#step-4-visualise-the-point-cloud)
5. [Step 5: Verify the lifecycle](#step-5-verify-the-lifecycle)
6. [Further reading](#further-reading)

This recipe receives filtered sensor point clouds in an Angular web application. It follows the server ClientApp's `PointCloudService` and `PointCloudComponent`, adding explicit connection status, reconnection and cleanup. The [SignalR hub reference]({{ site.baseurl }}/software/apps/server/signal-r.html) describes the other available data and status streams.

## Step 1: Prepare server and client

1. Start ReFlex.TrackingServer, select a sensor (or the emulator), configure it and start tracking. A hub connection alone does **not** start the sensor. The server publishes point clouds from the filtering pipeline, so that pipeline must receive frames.
2. Use an existing Angular application. The example uses standalone components, RxJS and the SignalR client. The repository ClientApp currently pins `@microsoft/signalr` to `6.0.1`; when reproducing its setup in a separate application, install it with `npm install @microsoft/signalr@6.0.1`. The repository workspace already declares this dependency.
3. Set the hub URL to `/pointcloudhub` when the application is served by the tracking server. For a separately hosted application, use the server's absolute URL, including its actual scheme and port, followed by `/pointcloudhub`. Ensure the browser trusts the HTTPS certificate and the server permits the application's origin. The current `Startup.cs` CORS policy allows origins whose hostname is `localhost`; other hostnames need a corresponding server configuration change. An HTTPS page must use an HTTPS endpoint.

The payload is a flat `Point3[]` with `x`, `y`, `z`, `isValid` and `isFiltered` properties. These are sensor coordinates, not calibrated interaction coordinates. The server samples updates and can reduce the number of points according to `PointCloudSettingValues` (`UpdateInterval`, `FullResolution`, `PointCloudSize`). Do not assume that each message contains a full camera-resolution grid.

__[⬆ back to top](#table-of-contents)__

## Step 2: Connect and activate the stream

Create `sensor-stream.service.ts`. This service is provided by the consuming component so that each viewer owns its connection. The local interface mirrors `Point3` from `@reflex/shared-types`; inside the repository it can be replaced with that import.

The sequence is: register the `pointCloud` handler, await `start()`, then invoke `startPointCloud`. The latter registers this connection as a subscriber on the server. ReFlex uses pushed hub events here, not SignalR's `connection.stream()` API. `invoke()` also reports server-side activation failures to the caller.

{% highlight typescript linenos %}
import { Injectable, OnDestroy } from '@angular/core';
import {
  HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel
} from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';

export interface Point3 {
  x: number;
  y: number;
  z: number;
  isValid: boolean;
  isFiltered: boolean;
}

@Injectable()
export class SensorStreamService implements OnDestroy {
  private connection?: HubConnection;
  private destroyed = false;
  private readonly state = new BehaviorSubject(HubConnectionState.Disconnected);
  private readonly active = new BehaviorSubject(false);
  private readonly error = new BehaviorSubject<string | null>(null);
  private readonly frames = new Subject<Point3[]>();

  readonly state$ = this.state.asObservable();
  readonly active$ = this.active.asObservable();
  readonly error$ = this.error.asObservable();
  readonly points$ = this.frames.asObservable();

  async connect(hubUrl: string): Promise<void> {
    if (this.destroyed || this.connection) return;
    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();
    this.connection = connection;
    this.error.next(null);
    this.state.next(HubConnectionState.Connecting);

    // Ignore callbacks from a connection that has already been released.
    const current = () => this.connection === connection;
    connection.on('pointCloud', (points: Point3[]) => {
      if (current()) this.frames.next(points);
    });
    connection.onreconnecting(error => {
      if (!current()) return;
      this.active.next(false);
      this.state.next(HubConnectionState.Reconnecting);
      this.report(error ?? 'Connection lost; reconnecting.');
    });
    connection.onreconnected(() => {
      if (!current()) return;
      // The server sees a new connection: subscribe again.
      void this.activate(connection);
    });
    connection.onclose(error => {
      if (!current()) return;
      this.connection = undefined;
      connection.off('pointCloud');
      this.active.next(false);
      this.state.next(HubConnectionState.Disconnected);
      this.report(error ?? 'Connection closed. Select Connect to retry.');
    });

    try {
      await connection.start();
      if (current()) await this.activate(connection);
    } catch (error) {
      if (!current()) return;
      this.report(error);
      await this.disconnect();
    }
  }

  private async activate(connection: HubConnection): Promise<void> {
    this.state.next(connection.state);
    try {
      await connection.invoke('startPointCloud');
      if (this.connection !== connection) return;
      this.active.next(true);
      this.error.next(null);
    } catch (error) {
      if (this.connection !== connection) return;
      this.report(error);
      // A failed subscription must not look like an active stream.
      await this.disconnect();
    }
  }

  async disconnect(): Promise<void> {
    const connection = this.connection;
    if (!connection) return;
    this.connection = undefined;
    this.active.next(false);
    this.state.next(HubConnectionState.Disconnecting);
    connection.off('pointCloud');
    try {
      if (connection.state === HubConnectionState.Connected) {
        await connection.invoke('stopPointCloud');
      }
    } catch (error) {
      this.report(error);
    } finally {
      // Always stop, including during connection/reconnection or RPC failure.
      try {
        await connection.stop();
      } catch (error) {
        this.report(error);
      }
      if (!this.connection) this.state.next(HubConnectionState.Disconnected);
    }
  }

  private report(error: unknown): void {
    this.error.next(error instanceof Error ? error.message : String(error));
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    void this.disconnect().finally(() => {
      this.frames.complete();
      this.state.complete();
      this.active.complete();
      this.error.complete();
    });
  }
}
{% endhighlight %}

`state$` describes the transport; `active$` means the server acknowledged the subscription, not that a sensor frame has arrived. `error$` keeps failures visible without terminating `points$`, so the viewer can receive frames again after recovery.

Automatic reconnect retries an **established** connection after the configured delays. An initial `start()` failure is handled separately: this example reports it and lets the user retry with Connect. After exhausted reconnect attempts, `onclose` also returns the UI to Disconnected. Following successful reconnection, `startPointCloud` must run again because the server tracks subscriptions by connection ID. See Microsoft's [JavaScript client documentation](https://learn.microsoft.com/en-us/aspnet/core/signalr/javascript-client?view=aspnetcore-6.0#reconnect-clients) for the reconnect lifecycle.

To add another stream, use its hub URL, register its event handler before connecting, and invoke the corresponding subscription method after connecting and reconnecting. Keep separate `HubConnection` instances for different hub endpoints; consult the [hub reference]({{ site.baseurl }}/software/apps/server/signal-r.html) and the respective hub implementation for the contract.

__[⬆ back to top](#table-of-contents)__

## Step 3: Use the service in Angular

Create `sensor-viewer.component.ts`, import this standalone component into the containing component and place `<app-sensor-viewer />` in its template. The example displays the latest frame size; Step 4 explains how to render its points.

{% highlight typescript linenos %}
{% raw %}
import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { SensorStreamService } from './sensor-stream.service';

@Component({
  selector: 'app-sensor-viewer',
  standalone: true,
  imports: [CommonModule],
  providers: [SensorStreamService],
  template: `
    <p>Hub: {{ stream.state$ | async }}</p>
    <p>Subscription active: {{ stream.active$ | async }}</p>
    <p *ngIf="stream.error$ | async as error" role="alert">{{ error }}</p>
    <button (click)="connect()"
      [disabled]="(stream.state$ | async) !== 'Disconnected'">Connect</button>
    <button (click)="disconnect()"
      [disabled]="(stream.state$ | async) === 'Disconnected' ||
                  (stream.state$ | async) === 'Disconnecting'">Disconnect</button>
    <p>Points in latest frame: {{ pointCount }}</p>
  `
})
export class SensorViewerComponent implements OnDestroy {
  pointCount = 0;
  private readonly frames;

  constructor(readonly stream: SensorStreamService) {
    // Subscribe before Connect can activate delivery.
    this.frames = stream.points$.subscribe(points => {
      this.pointCount = points.length;
      // Forward points to the renderer here (Step 4).
    });
  }

  connect(): void {
    void this.stream.connect('/pointcloudhub');
  }

  disconnect(): void {
    this.pointCount = 0;
    void this.stream.disconnect();
  }

  ngOnDestroy(): void {
    this.frames.unsubscribe();
    // Angular also destroys the component-scoped service, which disconnects.
  }
}
{% endraw %}
{% endhighlight %}

Disconnect first asks the server to unsubscribe via `stopPointCloud`, then closes the hub connection with `stop()` even if that request fails. When the transport is already unavailable, no stop RPC is attempted; the server's `OnDisconnectedAsync` removes the subscription when it detects the disconnect. Unsubscribing from an RxJS observable alone does not close a hub connection in this example. Component destruction releases both resources. Stopping this viewer does not stop the sensor or other clients.

__[⬆ back to top](#table-of-contents)__

## Step 4: Visualise the point cloud

The ClientApp's `PointCloudComponent` uses Three.js: a `WebGLRenderer`, a scene, a perspective camera and a `THREE.Points` object backed by `BufferGeometry`. Each received point supplies three values in the geometry's `position` attribute. The ClientApp maps them to `(x * 10, y * -10, z * 10)` for display and colours them by depth, with filtered points shown in red. These scale factors and the flipped Y axis are display choices, not a change to the data protocol.

For a minimal renderer, the update function can look like this (assuming an existing `THREE.Points` object named `cloud`, with a `PointsMaterial`, added to the scene):

{% highlight typescript linenos %}
function updateCloud(cloud: THREE.Points, points: Point3[]): void {
  const visible = points.filter(p => p.isValid && !p.isFiltered &&
    Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
  const geometry = cloud.geometry;
  let position = geometry.getAttribute('position') as THREE.BufferAttribute;
  if (!position || position.count !== visible.length) {
    position = new THREE.BufferAttribute(new Float32Array(visible.length * 3), 3);
    geometry.setAttribute('position', position);
  }
  visible.forEach((p, i) => position.setXYZ(i, p.x * 10, p.y * -10, p.z * 10));
  position.needsUpdate = true;
  geometry.setDrawRange(0, visible.length);
  cloud.visible = visible.length > 0;
  if (cloud.visible) geometry.computeBoundingSphere();
}
{% endhighlight %}

Import `* as THREE from 'three'` and `Point3` from the service in the renderer file. The repository ClientApp already includes Three.js; an external project also needs `three` and its TypeScript declarations (`@types/three`). Fit the camera and clipping planes to the point cloud's bounds. Render with `requestAnimationFrame` independently of incoming frames, reusing buffers when the point count stays constant. For a high-rate stream, keep only the latest frame for the next render rather than queueing every frame. Clear or mark the last cloud as stale when the connection is lost.

On viewer destruction, cancel the animation loop, dispose the geometry, materials, controls and renderer, and remove the canvas. The complete ClientApp also adds orbit controls, depth colours, filtering bounds and interaction markers; these are optional for a basic point-cloud preview.

__[⬆ back to top](#table-of-contents)__

## Step 5: Verify the lifecycle

* **Normal operation:** Start tracking, select Connect and check that the hub becomes Connected, the subscription becomes active and frames arrive. Connected without frames usually calls for checking sensor and filtering state first.
* **Initial failure:** Use an unreachable server URL. The error should be visible and Connect should become available again. Correct the URL and retry.
* **Temporary interruption:** Interrupt the network, wait for Reconnecting, then restore it before retries expire. The subscription should be reactivated and frames should resume without another click.
* **Exhausted retries:** Leave the server unavailable until Disconnected appears, then restart it and select Connect.
* **Cleanup:** Disconnect or navigate away, including while connecting/reconnecting. Verify that delivery stops and returning to the viewer does not duplicate frame handlers. Use the browser network panel and server logs to inspect negotiation, transport and RPC failures.

__[⬆ back to top](#table-of-contents)__

## Further reading

* [SignalR hubs]({{ site.baseurl }}/software/apps/server/signal-r.html) and [processing pipeline]({{ site.baseurl }}/software/repo/pipeline.html).
* Client subscription: [point-cloud.service.ts](https://github.com/visualengineers/reflex/blob/main/tools/ReFlex.TrackingServer/ClientApp/src/shared/services/point-cloud.service.ts).
* Client rendering: [point-cloud.component.ts](https://github.com/visualengineers/reflex/blob/main/tools/ReFlex.TrackingServer/ClientApp/src/app/tracking/point-cloud/point-cloud.component.ts).
* Server subscription lifecycle: [PointCloudHub.cs](https://github.com/visualengineers/reflex/blob/main/tools/ReFlex.TrackingServer/Hubs/PointCloudHub.cs).

__[⬆ back to top](#table-of-contents)__
