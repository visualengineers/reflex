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
|                  | `startInteractionFrames`       | Streaming [InteractionFrames]({{ site.baseurl }}/software/repo/pipeline.html#identification-of-touch)  | Data      |
|                  | `startInteractionHistory`      | Streaming [InteractionHistory]({{ site.baseurl }}/software/repo/pipeline.html#identification-of-touch) | Data      |
| `/trkhub`        | `startRecordingState`          | Current sensor state                                                                                   | Status    |
| `/tuiohub`       | `startState`                   | Current [TUIO]({{ site.baseurl }}/software/repo/tuio.html) broadcast state                             | Status    |
|                  | `startPackageDetails`          | Streaming [TUIO]({{ site.baseurl }}/software/repo/tuio.html) packages                                  | Data      |

__[⬆ back to top](#table-of-contents)__
