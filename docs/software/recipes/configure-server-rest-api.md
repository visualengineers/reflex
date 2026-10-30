---
title: "ReFlex Client: Configure the server using the REST API"
---

# {{ page.title }}

<!-- omit in toc -->
## Table of Contents

1. [General approach](#general-approach)
2. [Step 1: Prepare a small web client](#step-1-prepare-a-small-web-client)
3. [Step 2: Read settings and available sensors](#step-2-read-settings-and-available-sensors)
4. [Step 3: Apply and save configuration](#step-3-apply-and-save-configuration)
5. [Step 4: Start the sensor and processing explicitly](#step-4-start-the-sensor-and-processing-explicitly)
6. [Step 5: Connect the buttons and verify the workflow](#step-5-connect-the-buttons-and-verify-the-workflow)
7. [Using the same workflow in Angular](#using-the-same-workflow-in-angular)
8. [Troubleshooting and further reading](#troubleshooting-and-further-reading)

## General approach

A web application can configure the ASP.NET tracking server through ordinary HTTP requests. This recipe builds a small Plain HTML/JavaScript client which reads `TrackingServerAppSettings`, changes the processing interval and observer, saves the configuration, and starts a sensor followed by interaction processing. It follows the same routes as the server's Angular `ClientApp`.

The [REST API reference]({{ site.baseurl }}/software/apps/server/rest-api.html) documents the complete endpoint and payload catalogue. Here we focus on the sequence of requests:

1. Read the current configuration and discover cameras and their stream configurations.
2. Apply individual settings to the running server.
3. Read back the complete settings object and save it explicitly.
4. Start the selected camera and wait for its `Streaming` state.
5. Start processing if its loop is not already running.

Configuration and runtime state are separate: saving settings does not replace an explicit start command. The example disables autostart so that the client controls when tracking and processing begin. Broadcasting is a separate component and is not required to configure the server or run processing.

## Step 1: Prepare a small web client

Start a configured tracking server using the [server documentation]({{ site.baseurl }}/software/apps/server/server-overview.html). Have a supported sensor and its drivers available, or configure the emulator first. Use the backend address reported at startup; the local launch profile normally exposes `http://localhost:5000` and `https://localhost:5001`.

Create `configure-server.html` in `tools/ReFlex.TrackingServer/wwwroot/`. Open it through the backend, for example at `http://localhost:5000/configure-server.html`. ASP.NET serves this directory through `UseStaticFiles()`. This gives the page and API the same origin. Do not open the file directly with a `file://` URL or run the example from the GitHub Pages documentation host.

Paste this HTML into the file. Insert the JavaScript blocks from the following steps, in order, inside its `<script type="module">` element.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Configure ReFlex</title>
</head>
<body>
  <h1>Configure ReFlex</h1>
  <!-- One fieldset lets JavaScript disable all controls during a request sequence. -->
  <fieldset id="controls">
    <legend>Server configuration</legend>
    <button id="reload" type="button">Reload settings and cameras</button>
    <!-- Options are populated from the API; their values identify available choices. -->
    <p><label>Sensor <select id="camera"></select></label></p>
    <p><label>Stream configuration <select id="configuration"></select></label></p>
    <p><label>Observer <select id="observer"></select></label></p>
    <p><label>Processing interval (ms)
      <input id="interval" type="number" min="1" step="1" value="50">
    </label></p>
    <button id="save" type="button">Apply and save settings</button>
    <button id="start" type="button">Start sensor and processing</button>
    <button id="status" type="button">Refresh status</button>
  </fieldset>
  <!-- Announce progress/errors and show configuration separately from runtime state. -->
  <p id="message" role="status"></p>
  <h2>TrackingServerAppSettings</h2>
  <pre id="settings"></pre>
  <h2>Runtime status</h2>
  <pre id="runtime"></pre>
  <script type="module">
    // Insert the JavaScript blocks from steps 2–5 here.
  </script>
</body>
</html>
```

## Step 2: Read settings and available sensors

Start with a shared request helper. Successful writes can return an empty body, including `202 Accepted` from the tracking toggle and the response from saving settings. Reading text first avoids calling `response.json()` on an empty response. HTTP failures include the response body in the displayed error.

```javascript
// Use the same backend origin that serves this HTML page.
const apiBase = new URL('/api/', window.location.origin);
const element = (id) => document.getElementById(id);

async function request(path, method = 'GET', body) {
  // Always query fresh state before deciding whether to send a toggle.
  const options = { method, cache: 'no-store' };
  // Preserve primitive bodies such as false and 0 as well as JSON objects.
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }
  const response = await fetch(new URL(path, apiBase), options);
  const text = await response.text();
  // fetch does not throw for HTTP errors; include the server's error details.
  if (!response.ok) {
    throw new Error(`${method} ${path}: ${response.status} ${text}`);
  }
  // Successful writes may have no response body (for example, 202 Accepted).
  return text.trim() ? JSON.parse(text) : null;
}

let cameras = [];
let configurations = [];

async function readSettings() {
  const settings = await request('Settings');
  // Render JSON as text, keeping every field available for a later full-object save.
  element('settings').textContent = JSON.stringify(settings, null, 2);
  return settings;
}

async function loadConfigurations() {
  // A configuration index belongs to one camera; discard the previous camera's list.
  configurations = [];
  element('configuration').replaceChildren();
  if (element('camera').selectedIndex < 0) return;
  // Routes use the camera's list index, not its string ID or serial number.
  const cameraIndex = Number(element('camera').value);
  configurations = await request(`Tracking/Configurations/${cameraIndex}`);
  configurations.forEach((configuration, index) => {
    element('configuration').add(new Option(
      configuration.description ||
        `${configuration.width} × ${configuration.height}, ${configuration.framerate} fps`,
      String(index)
    ));
  });
}

async function reload() {
  const settings = await readSettings();
  element('interval').value = settings.processingSettingValues.intervalDuration;
  // Map the current numeric enum value to the names offered by this server.
  const observerTypes = await request('Processing/GetObserverTypes');
  const observerIndex = await request('Processing/GetObserverType');
  element('observer').replaceChildren();
  observerTypes.forEach((name) => element('observer').add(new Option(name, name)));
  element('observer').value = observerTypes[observerIndex];

  // Discovery only populates the UI; it does not select or start a backend camera.
  cameras = await request('Tracking');
  element('camera').replaceChildren();
  cameras.forEach((camera, index) => {
    element('camera').add(new Option(`${camera.modelDescription} (${camera.id})`, String(index)));
  });
  await loadConfigurations();
  await refreshStatus();
  if (cameras.length === 0) throw new Error('No cameras available. Check sensor setup.');
}
```

`GET /api/Settings` returns the **complete** settings object, including filter, calibration, camera, processing and networking settings. ASP.NET serializes properties in camel case: for example, C# `ProcessingSettingValues.IntervalDuration` becomes `processingSettingValues.intervalDuration`.

The tracking route parameters are **zero-based list indices**, not the camera's string `id` or serial number. Configuration indices refer to the list returned for that camera. Reload the configuration list whenever the camera selection changes. Populating these dropdowns only reads information; it does not select or start a camera on the backend. The current observer enum uses consecutive values matching the names returned by `GetObserverTypes`.

## Step 3: Apply and save configuration

Use the dedicated endpoints to apply changes, then retrieve a fresh settings object and POST that entire object to `/api/Settings`. This preserves fields the example does not edit, including calibration and filter parameters. Do not send a partial settings object to this endpoint: it replaces the configuration rather than patching selected fields.

```javascript
async function applyAndSave() {
  // Validate before any write so invalid input cannot partially change the server.
  const interval = Number(element('interval').value);
  if (!Number.isInteger(interval) || interval < 1) {
    throw new Error('Enter a positive integer interval in milliseconds.');
  }
  const observer = element('observer').value;
  if (!observer) throw new Error('Select an observer first.');

  // This endpoint expects a JSON boolean; startup will be triggered explicitly.
  await request('Tracking/SetAutostart', 'PUT', false);
  // Processing setters require these exact JsonSimpleValue names.
  await request('Processing/SetUpdateInterval', 'POST', {
    name: 'UpdateInterval', value: interval
  });
  // Changing the observer also stops an already-running processing loop.
  await request('Processing/SelectObserverType', 'POST', {
    name: 'ObserverType', value: observer
  });
  // Re-read all fields after the setters, then persist the complete configuration.
  // Sending only the edited fields would replace unrelated settings with defaults.
  const settings = await readSettings();
  await request('Settings', 'POST', settings);
  await readSettings();
  await refreshStatus();
}
```

The autostart endpoint expects the primitive JSON boolean `false`. Processing endpoints expect `JsonSimpleValue<T>` objects with the exact `name` shown above. For a local demonstration, choose `SingleTouch` or `MultiTouch`; `Remote` requires a configured processing service, and `None` does not detect interactions.

The individual processing setters change runtime/in-memory settings. `POST /api/Settings` creates a backup and writes the current configuration to the server's configured settings file. `POST /api/Settings/LoadSettings` applies a complete object in memory and is not the persistence endpoint used here.

Selecting an observer stops an already-running processing loop. Consequently, **Apply and save** is a configuration action; use **Start sensor and processing** afterwards. The camera dropdown is not persisted by this step yet: starting the camera below updates its defaults, which are then saved separately.

## Step 4: Start the sensor and processing explicitly

The backend exposes toggles rather than separate idempotent start/stop endpoints. Never call a toggle blindly or automatically retry it after a network error: the server may already have processed the request. Read the state first and check it again afterwards.

```javascript
// Configuration values alone cannot tell us whether the components are running.
async function refreshStatus() {
  const tracking = await request('Tracking/Status');
  const processing = await request('Processing/IsLoopRunning');
  element('runtime').textContent = JSON.stringify({ tracking, processing }, null, 2);
  return { tracking, processing };
}

async function waitForStreaming(cameraId) {
  // Bound the number of status reads and pause between them; never retry the toggle.
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const state = await request('Tracking/Status');
    // Despite its name, selectedCameraName contains the camera's string ID.
    if (state?.selectedCameraName === cameraId &&
        state.depthCameraStateName === 'Streaming') return;
    if (state?.depthCameraStateName === 'Error') {
      throw new Error('Sensor reported Error. Check the server log and device.');
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Sensor did not reach Streaming. Refresh status before trying again.');
}

async function start() {
  if (element('camera').selectedIndex < 0 ||
      element('configuration').selectedIndex < 0) {
    throw new Error('Select a camera with an available stream configuration.');
  }
  // Routes use the camera's list index, not its string ID or serial number.
  const cameraIndex = Number(element('camera').value);
  const configurationIndex = Number(element('configuration').value);
  const camera = cameras[cameraIndex];
  const state = await request('Tracking/Status');

  if (state?.depthCameraStateName === 'Streaming') {
    // Do not reselect/reconfigure an active sensor through a toggle.
    if (state.selectedCameraName !== camera.id) {
      throw new Error('Another camera is streaming. Stop it in the server UI first.');
    }
    // Keep this camera's active configuration; dropdown changes apply on next start.
  } else {
    // The body is a primitive configuration index, e.g. 0, not an object.
    await request(`Tracking/ToggleTracking/${cameraIndex}`, 'PUT', configurationIndex);
  }
  // An accepted command is not yet proof that the sensor is supplying frames.
  await waitForStreaming(camera.id);

  // The tracking controller has now updated defaultCamera and cameraConfigurationValues.
  // Re-read all fields after the setters, then persist the complete configuration.
  // Sending only the edited fields would replace unrelated settings with defaults.
  const settings = await readSettings();
  await request('Settings', 'POST', settings);

  const processing = await request('Processing/IsLoopRunning');
  // Inspect the wrapper's boolean value; toggling a running loop would stop it.
  if (!processing.value) {
    const result = await request('Processing/ToggleInteractionProcessing', 'PUT');
    if (!result.value) throw new Error('Processing did not start. Refresh status.');
  }
  await refreshStatus();
}
```

`PUT /api/Tracking/ToggleTracking/{cameraIndex}` selects the camera and configuration as part of the operation. Its body is a **JSON number** such as `0`, not `{ "configIdx": 0 }`. No separate camera-selection requests are needed. A `202` response alone is not evidence that the sensor is streaming, hence the status polling. `selectedCameraName` in the status object contains the camera's **string ID**, despite its name.

An already-streaming selected camera is left running with its current configuration. To change the active sensor or stream configuration, stop tracking in the server UI first, then start again with the desired dropdown values. The processing status uses `{ "name": "IsLoopRunning", "value": true }`; inspect `value`, not the truthiness of the wrapper object.

These checks assume a single controlling client. Another browser or the server UI can change state between a GET and a toggle; the sequence is not atomic. The button lock below prevents overlapping operations within this page. If startup fails partway through, refresh status: the sensor may be running even though processing has not started. Stop it through the server UI if needed.

## Step 5: Connect the buttons and verify the workflow

Finally, connect the functions to the page. Disable the controls while a request sequence runs and display failures without retrying writes.

```javascript
async function run(action) {
  // Prevent overlapping clicks in this page while dependent requests execute.
  element('controls').disabled = true;
  element('message').textContent = 'Working…';
  try {
    await action();
    element('message').textContent = 'Done. Check settings and runtime status below.';
  } catch (error) {
    // Report the failure without retrying a write that may already have succeeded.
    element('message').textContent = error.message;
  } finally {
    // Restore controls on both success and failure so the user can refresh status.
    element('controls').disabled = false;
  }
}

// Route every UI action through the shared busy/error handler.
element('reload').addEventListener('click', () => run(reload));
element('camera').addEventListener('change', () => run(loadConfigurations));
element('save').addEventListener('click', () => run(applyAndSave));
element('start').addEventListener('click', () => run(start));
element('status').addEventListener('click', () => run(refreshStatus));
// Initial loading performs GET requests only; starting requires a button click.
await run(reload);
```

1. Open the page and confirm that the full settings object and camera choices appear. The page performs only reads on initial load.
2. Choose a camera/configuration, a local observer and an interval such as `50` ms. Click **Apply and save settings**. Confirm `isAutoStartEnabled: false` and the new `processingSettingValues.intervalDuration` in the displayed settings.
3. Click **Start sensor and processing**. Expect `depthCameraStateName: "Streaming"` and processing `value: true`. In the browser's Network panel, the tracking PUT carries the selected configuration index and precedes the processing toggle.
4. Click **Start sensor and processing** again. With the same camera still streaming, neither toggle should be sent; processing stays running.
5. Restart the backend and reload the page to verify persistence. The interval, observer and camera defaults should remain saved, while autostart remains disabled. Runtime status and the server log help distinguish a successful configuration write from a sensor or processing failure.

A running loop does not guarantee detected touches: the surface, filter settings and calibration must also be configured. To send results to external consumers, configure and start networking separately using the [Network endpoints]({{ site.baseurl }}/software/apps/server/rest-api.html#network), for example `POST /api/Network/StartBroadcast` with a complete `NetworkSettings` object. Processing and networking have independent state.

## Using the same workflow in Angular

The existing server client separates these operations into injectable services under `tools/ReFlex.TrackingServer/ClientApp/src/shared/services/`:

| Plain JavaScript operation | Existing Angular service method |
| -------------------------- | ------------------------------- |
| Read and display settings | `SettingsService.getSettings()` subscribes to updates; `update()` performs the GET |
| Persist complete settings | `SettingsService.saveSettings(settings)` |
| Discover cameras/configurations | `TrackingService.getCameras()`, `getConfigurationsForCamera(cameraIdx)` |
| Disable autostart / toggle tracking | `TrackingService.setAutostartEnabled(false)`, `toggleCamera(cameraIdx, configIdx)` |
| Set interval and observer | `ProcessingService.setInterval(ms)`, `setObserverType(name)` |
| Query / toggle processing | `ProcessingService.getIsLoopRunning()`, `toggleProcessing()` |

The service source files are `settingsService.ts`, `tracking.service.ts` and `processing.service.ts`. They use `HttpClient`, the injected `BASE_URL` and shared models from `@reflex/shared-types`. Subscribe to HTTP observables (or await them through `firstValueFrom`) to execute requests, and sequence dependent writes rather than starting them in parallel. Subscribe to the settings stream before calling `update()`, since it uses a `Subject` without replaying the previous value. Methods using `observe: 'response'` expose the payload through `response.body`.

The Angular tracking and processing services also receive live state through SignalR. The small client above uses REST status reads so that no SignalR setup is necessary; see the [SignalR documentation](https://github.com/visualengineers/reflex/blob/main/docs/software/apps/server/signal-r.md) when adding live updates.

## Troubleshooting and further reading

* **CORS or connection failure:** use the backend's actual HTTP(S) address. For a separate frontend dev server, configure its `/api` proxy or the backend's allowed origins. The current `Startup.cs` CORS policy accepts origins whose hostname is `localhost`; `127.0.0.1` and other hostnames do not match that rule. A browser must trust the backend's HTTPS certificate, and an HTTPS page cannot fetch an HTTP backend as mixed content.
* **400 response:** check the JSON body and `Content-Type`. `UpdateInterval` and `ObserverType` are case-sensitive `name` values; a tracking configuration index is a primitive number.
* **Unexpected stop:** a repeated toggle reverses the state. Refresh status before any retry. Selecting an observer also stops processing.
* **Changes lost after restart:** individual runtime setters are not a substitute for saving the complete settings object. Avoid concurrent configuration editors, since a full-object POST can overwrite another client's changes.
* **No sensor data or interactions:** inspect the [tracking view](https://github.com/visualengineers/reflex/blob/main/docs/software/apps/server/tracking-view.md), [processing view](https://github.com/visualengineers/reflex/blob/main/docs/software/apps/server/processing-view.md) and server log. A timeout does not cancel a previously accepted start request.

For other configuration fields and all available operations, refer to the [REST API reference]({{ site.baseurl }}/software/apps/server/rest-api.html).
