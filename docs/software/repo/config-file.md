---
title: Server Configuration
---

# {{ page.title }}

<!-- omit in toc -->
## Table of Contents

1. [Introduction](#introduction)
2. [FilterSettingValues](#filtersettingvalues)
3. [CalibrationValues](#calibrationvalues)
4. [FrameSize](#framesize)
5. [Camera and Startup](#camera-and-startup)
6. [CameraConfigurationValues](#cameraconfigurationvalues)
7. [NetworkSettingValues](#networksettingvalues)
8. [PointCloudSettingValues](#pointcloudsettingvalues)
9. [ProcessingSettingValues](#processingsettingvalues)
10. [RemoteProcessingServiceSettingsValues](#remoteprocessingservicesettingsvalues)
11. [TuioSettingValues](#tuiosettingvalues)
12. [Contact Assignment and Prediction](#contact-assignment-and-prediction)

## Introduction

`tools/ReFlex.TrackingServer/wwwroot/Config/TrackingSettings.json` stores the tracking server configuration represented by `TrackingServerAppSettings`. The sections below follow the file's structure and use its exact property names. Enum values are stored as numbers.

**Example Value** refers to the values currently checked into the repository, not universal defaults or recommended values for another installation. Camera settings, calibration and the filter mask depend on the physical setup. Explicit C# class defaults are noted separately where relevant. Types refer to the C# model; JSON uses numbers, booleans, strings, arrays and objects.

The [Settings REST endpoints]({{ site.baseurl }}/software/apps/server/rest-api.html#settings) expose the current configuration and operations for applying, saving, restoring and resetting it. The processing stages are described in the [pipeline documentation]({{ site.baseurl }}/software/repo/pipeline.html).

__[⬆ back to top](#table-of-contents)__

## FilterSettingValues

Filtering and interaction detection parameters (`FilterSettings`). Nested parameter groups are documented below.

| Property | Type (.NET) | Example value | Description |
| --- | --- | --- | --- |
| `Threshold` | `float` | `156.0` | Maximum depth difference between neighbouring points before the threshold filter treats a point as an outlier; uses the depth data units. |
| `MinDistanceFromSensor` | `float` | `0.0` | Minimum accepted sensor distance. |
| `LimitationFilterType` | `LimitationFilterType` | `1` | `0`: LimitationFilter; `1`: AdvancedLimitationFilter. |
| `FilterMask` | `bool[][]?` | `Array` | Persisted advanced limitation mask, indexed as [x][y]. True marks positions accepted near the zero plane during initialization. Dimensions must match the sensor data. |
| `UseOptimizedBoxFilter` | `bool` | `true` | Selects the optimized box filter. |
| `AdvancedLimitationFilterThreshold` | `float` | `0.06` | Maximum deviation from the zero plane when initializing the mask, in depth data units. |
| `AdvancedLimitationFilterSamples` | `int` | `8` | Number of frames sampled to initialize the mask. |
| `IsLimitationFilterEnabled` | `bool` | `true` | Enables spatial limitation filtering. |
| `IsValueFilterEnabled` | `bool` | `true` | Enables invalid-value filtering. |
| `IsThresholdFilterEnabled` | `bool` | `true` | Enables depth outlier filtering. |
| `IsBoxFilterEnabled` | `bool` | `true` | Enables spatial box smoothing. |
| `MeasurePerformance` | `bool` | `true` | Enables performance measurement. |
| `BoxFilterRadius` | `int` | `4` | Spatial smoothing radius in sensor pixels. |
| `BoxFilterNumPasses` | `int` | `2` | Number of optimized box-filter passes. |
| `BoxFilterNumThreads` | `int` | `0` | Thread setting for the optimized box filter. |
| `MinAngle` | `float` | `0.5` | Angle threshold used by multi-touch extremum detection. |

__[⬆ back to top](#table-of-contents)__

### BorderValue

Sensor-space boundaries of the region processed by the limitation filter.

| Property | Type (.NET) | Example value | Description |
| --- | --- | --- | --- |
| `Left` | `int` | `12` | Left boundary (pixels). |
| `Right` | `int` | `616` | Right boundary (pixels). |
| `Top` | `int` | `132` | Upper boundary (pixels). |
| `Bottom` | `int` | `480` | Lower boundary (pixels). |

__[⬆ back to top](#table-of-contents)__

### DistanceValue

Depth normalization and separation of detected interactions.

| Property | Type (.NET) | Example value | Description |
| --- | --- | --- | --- |
| `Min` | `float` | `0.04` | Minimum deformation distance from the zero plane. |
| `Max` | `float` | `0.24` | Maximum deformation distance used for depth normalization. |
| `Default` | `float` | `0.77` | Sensor distance of the undeformed surface (zero plane); also the box-filter default value. |
| `InputDistance` | `float` | `40.0` | Clustering threshold compared with Manhattan distance (`abs(dx) + abs(dy)`) in sensor pixels. The legacy helper is named `Squared2DDistance`, but does not square the distance. |

__[⬆ back to top](#table-of-contents)__

### Confidence

Temporal stability thresholds for tracked touches.

| Property | Type (.NET) | Example value | Description |
| --- | --- | --- | --- |
| `Min` | `int` | `2` | Minimum confidence threshold. |
| `Max` | `int` | `20` | Maximum confidence accumulated for a tracked touch. |

__[⬆ back to top](#table-of-contents)__

### SmoothingValues

Interaction history, matching and temporal smoothing (`SmoothingParameter`).

| Property | Type (.NET) | Example value | Description |
| --- | --- | --- | --- |
| `InteractionHistorySize` | `int` | `15` | Number of frames retained in the interaction history. |
| `NumSmoothingSamples` | `int` | `9` | Number of samples used for temporal smoothing. |
| `ContactRetentionSeconds` | `double` | `0.1` | Retention after a completed observation misses a contact. Finite and non-negative; default `0.1`. |
| `ObservationTimeoutSeconds` | `double` | `1.0` | Maximum sensor/processing silence and acceptable observation age, in seconds. Finite and non-negative; default `1`. |
| `ConfidenceGainPerSecond` | `float` | `30.0` | Confidence gained per second between consecutive detections; default `30`. |
| `ConfidenceDecayPerSecond` | `float` | `30.0` | Confidence lost per second without measurements; `0` disables decay. Default `30`. |
| `TouchMergeDistance2D` | `float` | `72.0` | Strict Manhattan-distance gate in sensor pixels for matching touches across frames. |
| `DepthScale` | `float` | `490.0` | Scale factor for depth in interaction smoothing/matching. |
| `Type` | `FilterType` | `2` | `0`: None; `1`: MovingAverage; `2`: WeightedMovingAverage; `3`: SavitzkyGolay; `4`: PolynomialFit; `5`: WeightedPolynomialFit; `6`: Butterworth. |

Legacy JSON containing `MaxNumEmptyFramesBetween` is still accepted: the value is divided by `30` to obtain seconds. An explicit `ContactRetentionSeconds` wins regardless of JSON property order. New saves omit the legacy field. This migration assumes 30 Hz; review the retention time for installations previously using another cadence. It only preserves JSON loading: custom C# callers and observer/manager implementations must migrate the removed frame-count API as described in [Migrating custom observers and managers]({{ site.baseurl }}/software/recipes/interaction-processor.html#migrating-custom-observers-and-managers).

History size limits stored frames and the smoothing/prediction sample counts; it does not set contact lifetime. A history size of `0` disables tracking and smoothing and assigns fresh IDs to each observation. Missing observations do not become smoothing or motion samples.

__[⬆ back to top](#table-of-contents)__

### ExtremumSettings

Sampling parameters for classifying local extrema.

| Property | Type (.NET) | Example value | Description |
| --- | --- | --- | --- |
| `NumSamples` | `int` | `10` | Number of surrounding samples. |
| `CheckRadius` | `int` | `20` | Sampling radius around the extremum. |
| `MergeRadius` | `float` | `3` | Euclidean radius in sensor pixels for consolidating same-type extrema before tracking. Range `0`–`32`; `0` disables consolidation. Default `3`. |
| `FitPercentage` | `float` | `0.9` | Required fraction of samples supporting the classification, in [0, 1]. |
| `CheckMethod` | `ExtremumTypeCheckMethod` | `1` | `0`: Global; `1`: FixedRadius; `2`: StochasticStatic; `3`: StochasticDynamic. Static random samples are reused; dynamic samples are regenerated. |

__[⬆ back to top](#table-of-contents)__

## CalibrationValues

Persisted calibration correspondences. Despite their names, the calibrator stores predefined screen positions in `SourceValues` and measured sensor positions in `TargetValues`. Three point pairs are used to compute the transformation.

| Property | Type (.NET) | Example value | Description |
| --- | --- | --- | --- |
| `SourceValues` | `List<int[]>` | `[[1200, 360, -1], [1200, 720, -1], [600, 720, -1]]` | Reference screen points as [x, y, id]; generated reference points use id -1. |
| `TargetValues` | `List<int[]>` | `[[406, 342, 134], [402, 205, 135], [180, 209, 136]]` | Measured sensor points as [x, y, touchId]. The third entry is an identifier, not depth. |
| `UpperThreshold` | `int` | `1010` | Stored upper threshold for the calibration gradient processor. |
| `LowerThreshold` | `int` | `960` | Stored lower threshold for the calibration gradient processor. |
| `LastUpdated` | `List<DateTime>` | `["2025-04-14T16:17:53.4293293+02:00", "2025-04-14T16:17:58.5862257+02:00", "2025-04-14T16:18:03.7263554+02:00"]` | Update timestamps for calibration points, serialized as ISO date/time strings. |

__[⬆ back to top](#table-of-contents)__

## FrameSize

Projection/calibration viewport (`FrameSizeDefinition`).

| Property | Type (.NET) | Example value | Description |
| --- | --- | --- | --- |
| `Width` | `int` | `1920` | Viewport width in pixels. |
| `Height` | `int` | `1080` | Viewport height in pixels. |
| `Left` | `int` | `0` | Horizontal viewport offset in pixels. |
| `Top` | `int` | `0` | Vertical viewport offset in pixels. |

__[⬆ back to top](#table-of-contents)__

## Camera and Startup

These two properties are at the root of the configuration.

| Property | Type (.NET) | Example value | Description |
| --- | --- | --- | --- |
| `IsAutoStartEnabled` | `bool` | `true` | Enables automatic startup of tracking. |
| `DefaultCamera` | `string?` | `"Microsoft© Azure Kinect"` | Name of the camera selected for startup. |

__[⬆ back to top](#table-of-contents)__

## CameraConfigurationValues

Requested camera stream configuration (`CameraConfiguration`).

| Property | Type (.NET) | Example value | Description |
| --- | --- | --- | --- |
| `Width` | `int` | `640` | Depth stream width in pixels. |
| `Height` | `int` | `576` | Depth stream height in pixels. |
| `Framerate` | `int` | `30` | Frame rate in frames per second. |

__[⬆ back to top](#table-of-contents)__

## NetworkSettingValues

Transmission of the ReFlex interaction format (`NetworkSettings`). TUIO has separate settings below.

| Property | Type (.NET) | Example value | Description |
| --- | --- | --- | --- |
| `NetworkInterfaceType` | `NetworkInterface` | `1` | `0`: None; `1`: Websockets; `2`: Tcp. |
| `Interval` | `float` | `30.0` | Broadcast interval in milliseconds. |
| `Address` | `string` | `"127.0.0.1"` | Network address. |
| `Port` | `int` | `40001` | Network port. |
| `Endpoint` | `string` | `"/ReFlex"` | WebSocket endpoint path. |

__[⬆ back to top](#table-of-contents)__

## PointCloudSettingValues

Point-cloud preview settings. The class defaults match the saved values shown here.

| Property | Type (.NET) | Example value | Description |
| --- | --- | --- | --- |
| `FullResolution` | `bool` | `false` | Enables the full-resolution point cloud. |
| `UpdateInterval` | `int` | `100` | Point-cloud update interval in milliseconds. |
| `PointCloudSize` | `int` | `40000` | Target point count for the reduced point cloud. |

__[⬆ back to top](#table-of-contents)__

## ProcessingSettingValues

Interaction processing configuration (`ProcessingSettings`).

| Property | Type (.NET) | Example value | Description |
| --- | --- | --- | --- |
| `InteractionType` | `ObserverType` | `2` | `0`: None; `1`: SingleTouch; `2`: MultiTouch; `3`: Remote. This selects the observer, not the push/pull interaction type. |
| `IntervalDuration` | `int` | `50` | Processing update interval in milliseconds. |
| `UseObservationSnapshots` | `bool` | `true` | Copy paired point-cloud/vector-field observations for processing. When false, reserve the live rasters during analysis and skip incoming sensor updates while reserved. Default `true`. |

__[⬆ back to top](#table-of-contents)__

## RemoteProcessingServiceSettingsValues

Configuration of the remote processing service. Class defaults are `http://localhost:50051/`, Skip `0`, complete dataset `true`, gzip `true`, cutoff `2`, factor `100` and algorithm `Default`.

| Property | Type (.NET) | Example value | Description |
| --- | --- | --- | --- |
| `Address` | `string` | `"http://localhost:50051"` | Remote processing service URL. |
| `NumSkipValues` | `int` | `0` | Stored sample-skipping parameter; its effect depends on the remote processing implementation. |
| `CompleteDataSet` | `bool` | `false` | Selects transmission of the complete dataset. |
| `UseGzipCompression` | `bool` | `true` | Requests lossless gzip compression for large depth payloads. Missing values in older saved configurations default to enabled. |
| `CutOff` | `double` | `2.0` | Filter cutoff parameter passed to the remote service. |
| `Factor` | `double` | `100.0` | Scaling factor passed to the remote service. |
| `Algorithm` | `RemoteProcessingAlgorithm` | `0` | `0`: Default; `1`: FiltFilt. |

__[⬆ back to top](#table-of-contents)__

## TuioSettingValues

TUIO transmission settings (`TuioConfiguration`). See the [TUIO interface]({{ site.baseurl }}/software/repo/tuio.html) for message formats and coordinate mapping.

| Property | Type (.NET) | Example value | Description |
| --- | --- | --- | --- |
| `SensorWidth` | `int` | `640` | Sensor width used to compute dimension = SensorWidth × SensorHeight. |
| `SensorHeight` | `int` | `576` | Sensor height used to compute dimension. |
| `SensorDescription` | `string` | `"Microsoft© Azure Kinect"` | Sensor name included in the source description. |
| `SessionId` | `int` | `33` | Session identifier used in point and alive messages. |
| `ServerAddress` | `string` | `"127.0.0.1"` | Address of the TUIO receiver. Class default: 127.0.0.1. |
| `ServerPort` | `int` | `3333` | Receiver port. Class default: 3333. |
| `Protocol` | `ProtocolVersion` | `0` | `0`: TUIO_VERSION_1_1; `1`: TUIO_VERSION_2_0 (class default). |
| `Transport` | `TransportProtocol` | `0` | `0`: Udp (class default); `1`: Tcp; `2`: WebSocket. |
| `Interpretation` | `TuioInterpretation` | `0` | `0`: TouchPoint2DwithPressure (class default); `1`: Point3D. |

__[⬆ back to top](#table-of-contents)__

The [TUIO REST endpoints]({{ site.baseurl }}/software/apps/server/rest-api.html#tuio) provide configuration, start/stop and persistence operations. Broadcasting is toggled with `PUT /api/Tuio/ToggleBroadcast`; the current configuration is available through `GET /api/Tuio/GetTuioConfiguration`.

The [SignalR interface]({{ site.baseurl }}/software/apps/server/signal-r.html#list-of-signalr-hubs) exposes `/tuiohub`: `startState` subscribes to the broadcast state and `startPackageDetails` subscribes to package details for monitoring.

__[⬆ back to top](#table-of-contents)__

## Contact Assignment and Prediction

The assignment properties live at the root of `TrackingServerAppSettings`. Omitted fields use these defaults:

| Property | Default | Meaning |
| --- | --- | --- |
| `UseMinimumCostAssignment` | `true` | Globally minimize one-to-one assignment costs. False selects greedy one-to-one matching. Switching preserves existing tracks. |
| `AssignmentMissCost` | `0.5` | Cost of leaving a track unmatched. Must be finite and non-negative. |
| `AssignmentBirthCost` | `0.5` | Cost of creating a new track. Must be finite and non-negative. |

Matching costs use Manhattan distance divided by `TouchMergeDistance2D`. The strict distance gate applies independently of the costs. Miss and birth costs affect only minimum-cost assignment; retention and confidence remain separate controls.

`PredictionSettings` is another root-level object:

| Property | Default | Meaning |
| --- | --- | --- |
| `PredictionHorizonSeconds` | `0.05` | Diagnostic forecast horizon, from `0` to `1` seconds. Assignment uses the actual observation time instead. |
| `UseVelocityPrediction` | `true` | Predict matching positions and produce motion diagnostics. |
| `NumFramesForPrediction` | `3` | Requested number of real measurements for motion fitting; the running tracker limits this to history capacity. The REST endpoint requires at least `2`. |
| `UseSecondDerivation` | `false` | Fit acceleration when at least three measurements are available. |
| `SecondDerivationMagnitude` | `0.5` | Acceleration weight from `0` to `1`; `0.5` gives `p + v*h + 0.5*a*h²`. |

Motion fits use monotonic capture times in seconds. Diagnostic X/Y positions are sensor pixels, velocity is pixels/s, and acceleration is pixels/s². Z uses normalized interaction depth. The display calibrates positions; the forecast-value table retains sensor coordinates.

See [Motion prediction]({{ site.baseurl }}/software/apps/server/processing-view.html#motion-prediction) for the controls and [REST settings]({{ site.baseurl }}/software/apps/server/rest-api.html#settings) for requests.

__[⬆ back to top](#table-of-contents)__
