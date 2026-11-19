# ReFlex.TrackingServer: SignalR

<!-- omit in toc -->
## Table of contents

1. [Introduction](#introduction)
2. [List of SignalR-Hubs](#list-of-signalr-hubs)

## Introduction

Various types of data can be received via the SignalR protocol. These include, on the one hand, notifications regarding status changes in subsystems and, on the other hand, complex data such as the interaction history, the point cloud and the vector field, as well as performance data. The interface is organised into hubs, each of which encapsulates different types of information. Within each hub, various methods are defined through which the client can subscribe to the relevant information.

__[⬆ back to top](#table-of-contents)__

## List of SignalR-Hubs

| Address          | Method                         | Description                                                                                            | Type      |
| ---------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------ | --------- |
| `/calibhub`      | `startCalibrationSubscription` | Current calibration status                                                                             | Status    |
| `/nethub`        | `startState`                   | Current status of the transmission                                                                     | Status    |
| `/perfhub`       | `startCollectingData`          | Enabling/Disabling Performance Monitoring - Streaming Performance Data                                 | Diagnosis |
| `/pointcloudhub` | `startPointCloud`              | Streaming the point cloud                                                                              | Data      |
|                  | `startVectorField`             | Streaming the [vector field]({{ site.baseurl }}/software/repo/pipeline.html#vector-field-computation)  | Data      |
| `/prochub`       | `startState`                   | Current processing status                                                                              | Status    |
|                  | `startInteractions`            | Streaming [interaction data]({{ site.baseurl }}/software/repo/interactions.html)                       | Data      |
|                  | `startVelocities`              | Streaming atomic motion diagnostics through the `velocities` event; unsubscribe with `stopVelocities`. | Diagnosis |
|                  | `startInteractionFrames`       | Streaming [InteractionFrames]({{ site.baseurl }}/software/repo/pipeline.html#identification-of-touch)  | Data      |
|                  | `startInteractionHistory`      | Streaming [InteractionHistory]({{ site.baseurl }}/software/repo/pipeline.html#identification-of-touch) | Data      |
| `/trkhub`        | `startRecordingState`          | Current sensor state                                                                                   | Status    |
| `/tuiohub`       | `startState`                   | Current [TUIO]({{ site.baseurl }}/software/repo/tuio.html) broadcast state                             | Status    |
|                  | `startPackageDetails`          | Streaming [TUIO]({{ site.baseurl }}/software/repo/tuio.html) packages                                  | Data      |

### Motion diagnostics

Register a `velocities` handler and call `StartVelocities` after connecting to `/prochub`.
Each event contains an array of `InteractionVelocity` snapshots. Call `StopVelocities`
when the view is no longer needed. Prediction must be enabled to produce track diagnostics.

Each entry carries its own `frameId`, `lastMeasuredFrameId`, monotonic timestamps,
measured/smoothed/matching positions and linear/acceleration forecasts. All positions
are in the sensor raster, with normalized Z depth; X/Y derivatives use pixels/s and
pixels/s². `predictionTimestampSeconds` identifies the forecast target. Do not join
independently arriving interaction and velocity events by arrival order.

`isPredicted` marks a retained lost contact, not a new measurement. `isPublished` and
`suppressionReason` distinguish published contacts from those hidden by confidence,
observer selection or final clustering. Empty arrays clear the diagnostic display.
See [Motion prediction]({{ site.baseurl }}/software/apps/server/processing-view.html#motion-prediction)
for the display layers and units.

__[⬆ back to top](#table-of-contents)__
