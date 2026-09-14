# ReFlex TrackingServer REST API

## Notes

- The base route for REST endpoints is usually `/api/{Controller}`.
- Some endpoints expect primitive JSON values in the body, for example `true`, `3`, or `"recording-01"`.
- Many write endpoints use `JsonSimpleValue<T>` in the format `{"name":"Port","value":9000}`. For the endpoints marked in the table, `name` must exactly match the specified value; otherwise, the controller responds with `400 Bad Request`.
- `PUT /api/Tracking/{id}` and `PUT /api/Tracking/Configuration/{id}` have a body parameter, but the controller does not evaluate it.
- The WebSocket endpoint `GET /ReFlex` is not a REST endpoint and is therefore not included in this table.

## Example Requests

The local launch profiles use `http://localhost:5000` or `https://localhost:5001` by default.

```bash
BASE_URL=http://localhost:5000
JSON_HEADER='Content-Type: application/json'
```

When testing locally over HTTPS, `curl -k` is often more convenient because of the development certificate:

```bash
BASE_URL=https://localhost:5001
curl -k "$BASE_URL/api/VersionInfo"
```

### Simple GET Requests

```bash
curl "$BASE_URL/api/Tracking"
curl "$BASE_URL/api/Tracking/Status"
curl "$BASE_URL/api/Settings"
curl "$BASE_URL/api/DepthImage/PointCloud"
curl "$BASE_URL/api/VersionInfo"
```

### Primitive JSON Bodies

JSON strings must be serialized as JSON strings in `curl`, for example `-d '"recording-01"'`.

```bash
curl -X PUT "$BASE_URL/api/Tracking/StartRecording" \
  -H "$JSON_HEADER" \
  -d '"recording-01"'

curl -X PUT "$BASE_URL/api/Tracking/SetAutostart" \
  -H "$JSON_HEADER" \
  -d 'true'

curl -X POST "$BASE_URL/api/Settings/Threshold" \
  -H "$JSON_HEADER" \
  -d '0.12'

curl -X PUT "$BASE_URL/api/Tracking/SetDepthImagePreview" \
  -H "$JSON_HEADER" \
  -d 'false'
```

### `JsonSimpleValue<T>` Bodies

```bash
curl -X POST "$BASE_URL/api/Network/SetPort" \
  -H "$JSON_HEADER" \
  -d '{"name":"Port","value":5500}'

curl -X POST "$BASE_URL/api/Processing/SetUpdateInterval" \
  -H "$JSON_HEADER" \
  -d '{"name":"UpdateInterval","value":50}'

curl -X POST "$BASE_URL/api/Processing/SelectObserverType" \
  -H "$JSON_HEADER" \
  -d '{"name":"ObserverType","value":"Remote"}'

curl -X POST "$BASE_URL/api/Tuio/SelectTransportProtocol" \
  -H "$JSON_HEADER" \
  -d '{"name":"TransportProtocol","value":"Udp"}'

curl -X POST "$BASE_URL/api/Log/Add" \
  -H "$JSON_HEADER" \
  -d '{"name":"Message","value":"API smoke test"}'
```

### Object Payloads

```bash
curl -X POST "$BASE_URL/api/Calibration/UpdateFrameSize" \
  -H "$JSON_HEADER" \
  -d '{"width":1920,"height":1080,"left":0,"top":0}'

curl -X POST "$BASE_URL/api/Calibration/UpdateCalibrationPoint/0" \
  -H "$JSON_HEADER" \
  -d '{"positionX":120,"positionY":250,"touchId":1}'

curl -X POST "$BASE_URL/api/Processing/SetRemoteProcessorSettings" \
  -H "$JSON_HEADER" \
  -d '{"address":"http://localhost:50051/","numSkipValues":0,"completeDataSet":true,"cutOff":0.1,"factor":1200,"algorithm":"Default"}'

curl -X POST "$BASE_URL/api/Network/StartBroadcast" \
  -H "$JSON_HEADER" \
  -d '{"networkInterfaceType":"Tcp","interval":33,"address":"127.0.0.1","port":7777,"endpoint":"reflex"}'

curl -X POST "$BASE_URL/api/Settings/PointCloudSettings" \
  -H "$JSON_HEADER" \
  -d '{"fullResolution":false,"updateInterval":100,"pointCloudSize":40000}'
```

### Endpoints with Path Parameters

```bash
curl "$BASE_URL/api/Tracking/Configurations/0"
curl "$BASE_URL/api/Tracking/RecordingFrameCount/recording-01"
curl "$BASE_URL/api/Log/Messages/25"

curl -X PUT "$BASE_URL/api/Tracking/ToggleTracking/0" \
  -H "$JSON_HEADER" \
  -d '0'

curl -X PUT "$BASE_URL/api/RecordRawDepth/RecordSamples" \
  -H "$JSON_HEADER" \
  -d '{"name":"RecordId","value":42}'
```

## Calibration

| Method | Route | Request | Response | Description |
|---|---|---|---|---|
| `GET` | `/api/Calibration/FrameSize` | - | `FrameSizeDefinition` | Returns the current calibration window/frame size. |
| `GET` | `/api/Calibration/SourceValues` | - | `CalibrationPoint[]` | Returns the calibration source points. |
| `GET` | `/api/Calibration/TargetValues` | - | `CalibrationPoint[]` | Returns the calibration target points. |
| `GET` | `/api/Calibration/GetCalibrationMatrix` | - | `CalibrationTransform` | Recalculates and returns the transformation matrix. |
| `GET` | `/api/Calibration/ApplyCalibration` | - | `CalibrationTransform` | Calculates and returns the transformation matrix. |
| `GET` | `/api/Calibration/Restart` | - | `CalibrationTransform` | Resets the calibration process and returns the current matrix. |
| `GET` | `/api/Calibration/SaveCalibration` | - | `CalibrationTransform` | Completes calibration and returns the saved matrix. |
| `POST` | `/api/Calibration/UpdateFrameSize` | Body: `FrameSizeDefinition` | `FrameSizeDefinition` or `400` | Sets the calibration window/frame size. |
| `POST` | `/api/Calibration/UpdateCalibrationPoint/{index}` | Path: `index` (`0..2`), Body: `CalibrationPoint` | `CalibrationTransform` or `400` | Updates an existing target point and returns the resulting matrix. |
| `POST` | `/api/Calibration/AddCalibrationPoint` | Body: `CalibrationPoint` | `CalibrationTransform` or `400` | Adds another calibration point. |
| `POST` | `/api/Calibration/CalibratedInteractions` | Body: `Interaction[]` | `Interaction[]` or `400` | Calibrates an interaction array and returns the calibrated values. |

## Tracking

| Method | Route | Request | Response | Description |
|---|---|---|---|---|
| `GET` | `/api/Tracking` | - | `IDepthCamera[]` | Returns all available cameras. |
| `GET` | `/api/Tracking/{id}` | Path: camera ID | `IDepthCamera` or `null` | Returns a single camera by its ID. |
| `PUT` | `/api/Tracking/{id}` | Path: camera ID, Body: JSON string (unused) | empty | Selects a camera by ID. |
| `GET` | `/api/Tracking/Configurations/{id}` | Path: camera ID | `StreamParameter[]` | Returns the available configurations for a camera. |
| `PUT` | `/api/Tracking/Configuration/{id}` | Path: configuration ID, Body: JSON string (unused) | empty | Selects a camera configuration by ID. |
| `GET` | `/api/Tracking/SelectedCamera` | - | `IDepthCamera` | Returns the currently selected camera. |
| `GET` | `/api/Tracking/SelectedCameraConfig` | - | `StreamParameter` | Returns the currently selected camera configuration. |
| `PUT` | `/api/Tracking/SetDepthImagePreview` | Body: JSON boolean | `202 Accepted` | Enables or disables the raw depth preview stream. |
| `PUT` | `/api/Tracking/SetDepthImagePointCloudPreview` | Body: JSON boolean | `202 Accepted` | Enables or disables the point cloud preview stream. |
| `GET` | `/api/Tracking/Status` | - | `TrackingConfigState` or `null` | Returns the current tracking status. |
| `PUT` | `/api/Tracking/ToggleTracking/{id}` | Path: camera ID, Body: JSON integer `configIdx` | `202 Accepted` | Starts or stops tracking for the camera and configuration. |
| `GET` | `/api/Tracking/Recordings` | - | `StreamParameter[]` | Returns the existing recording configurations. |
| `PUT` | `/api/Tracking/StartRecording` | Body: JSON string `name` | `string` or `403` | Starts a recording for the currently streaming camera. |
| `GET` | `/api/Tracking/StopRecording` | - | `string` | Stops the running recording and returns the recorder result. |
| `PUT` | `/api/Tracking/DeleteRecording` | Body: JSON string `name` | `bool` | Deletes a named recording. |
| `GET` | `/api/Tracking/ClearRecordings` | - | `string` | Deletes all recordings and returns the number of deleted entries as a string. |
| `GET` | `/api/Tracking/RecordingState` | - | `bool` | Indicates whether recording is currently active. |
| `GET` | `/api/Tracking/RecordingFrameCount/{name}` | Path: recording name | `int` | Returns the number of stored frames for a recording. |
| `GET` | `/api/Tracking/GetAutostartEnabled` | - | `bool` | Returns the current auto-start status. |
| `PUT` | `/api/Tracking/SetAutostart` | Body: JSON boolean | `bool` | Sets the auto-start status. |

## Settings

| Method | Route | Request | Response | Description |
|---|---|---|---|---|
| `GET` | `/api/Settings` | - | `TrackingServerAppSettings` | Returns the complete current server configuration. |
| `POST` | `/api/Settings` | Body: `TrackingServerAppSettings` | empty | Applies and saves the complete configuration. |
| `GET` | `/api/Settings/CanRestore` | - | `JsonSimpleValue<bool>` | Returns whether a backup is available for restore. Name: `CanRestoreBackup`. |
| `GET` | `/api/Settings/Restore` | - | `TrackingServerAppSettings` | Restores the latest backup. |
| `GET` | `/api/Settings/Reset` | - | `TrackingServerAppSettings` | Resets the configuration to defaults. |
| `POST` | `/api/Settings/LoadSettings` | Body: `TrackingServerAppSettings` | `TrackingServerAppSettings` | Loads client-side settings into the server state. |
| `POST` | `/api/Settings/Border` | Body: `Border` | `Border` | Updates the border settings. |
| `POST` | `/api/Settings/MinDistanceFromSensor` | Body: JSON float | `float` | Sets the minimum distance from the sensor. |
| `POST` | `/api/Settings/LimitationFilterType` | Body: `FilterSettings` | `JsonSimpleValue<bool>` | Updates multiple limitation/filter settings together. Return value: `{name:"success", value:true}`. |
| `GET` | `/api/Settings/InitializeAdvancedLimitationFilter` | - | `JsonSimpleValue<bool>` | Initializes the advanced limitation filter. Return name: `Success`. |
| `GET` | `/api/Settings/LimitationFilterInitializing` | - | `JsonSimpleValue<bool>` | Returns the initialization status of the limitation filter. Name: `IsInitializing`. |
| `GET` | `/api/Settings/LimitationFilterInitState` | - | `JsonSimpleValue<bool>` | Returns whether the limitation filter is initialized. Name: `IsInitialized`. |
| `GET` | `/api/Settings/ResetAdvancedLimitationFilter` | - | `JsonSimpleValue<bool>` | Resets the limitation filter. Return name: `Success`. |
| `GET` | `/api/Settings/ComputeZeroPlaneDistance` | - | `Distance` | Recalculates the zero-plane distance and saves it as the default. |
| `POST` | `/api/Settings/Distance` | Body: `Distance` | `Distance` | Updates the distance settings. |
| `POST` | `/api/Settings/Confidence` | Body: `ConfidenceParameter` | `ConfidenceParameter` | Updates the confidence settings. |
| `POST` | `/api/Settings/Threshold` | Body: JSON float | `JsonSimpleValue<float>` | Sets the threshold. Return name: `Threshold`. |
| `POST` | `/api/Settings/MinAngle` | Body: JSON float | `JsonSimpleValue<float>` | Sets the minimum angle. Return name: `MinAngle`. |
| `PUT` | `/api/Settings/FilterRadius/{radius}` | Path: `radius` | `JsonSimpleValue<int>` | Sets the box filter radius. Name: `BoxFilterRadius`. |
| `PUT` | `/api/Settings/FilterPasses/{numPasses}` | Path: `numPasses` | `JsonSimpleValue<int>` | Sets the number of box filter passes. Name: `BoxFilterNumPasses`. |
| `PUT` | `/api/Settings/FilterThreads/{numThreads}` | Path: `numThreads` | `JsonSimpleValue<int>` | Sets the number of box filter threads. Name: `BoxFilterNumThreads`. |
| `POST` | `/api/Settings/UseOptimizedBoxFilter` | Body: `JsonSimpleValue<bool>` | `JsonSimpleValue<bool>` | Enables or disables the optimized box filter. Only `value` is used. |
| `POST` | `/api/Settings/Smoothing` | Body: `SmoothingParameter` | `SmoothingParameter` | Updates the smoothing settings. |
| `POST` | `/api/Settings/ExtremumsCheck` | Body: `ExtremumDescriptionSettings` | `ExtremumDescriptionSettings` | Updates extremum detection. |
| `GET` | `/api/Settings/MeasurePerformance` | - | `JsonSimpleValue<bool>` | Returns whether performance measurement is active. Name: `MeasurePerformance`. |
| `POST` | `/api/Settings/MeasurePerformance` | Body: `JsonSimpleValue<bool>` | `JsonSimpleValue<bool>` | Sets performance measurement. Only `value` is used; return value: `{name:"success", value:true}`. |
| `POST` | `/api/Settings/PointCloudSettings` | Body: `PointCloudSettings` | `PointCloudSettings` | Updates the point cloud settings. |


## Processing

| Method | Route | Request | Response | Description |
|---|---|---|---|---|
| `GET` | `/api/Processing/GetInterval` | - | `int` | Returns the current update interval in milliseconds. |
| `GET` | `/api/Processing/GetObserverType` | - | `uint` | Returns the currently set `ObserverType` as a numeric enum value. |
| `GET` | `/api/Processing/GetObserverTypes` | - | `string[]` | Returns all available `ObserverType` names. |
| `GET` | `/api/Processing/GetRemoteProcessorSettings` | - | `RemoteProcessingServiceSettings` | Returns the remote processing configuration. |
| `GET` | `/api/Processing/IsLoopRunning` | - | `JsonSimpleValue<bool>` | Returns whether the processing loop is running. Name: `IsLoopRunning`. |
| `POST` | `/api/Processing/SetUpdateInterval` | Body: `JsonSimpleValue<int>` with `name = "UpdateInterval"` | `JsonSimpleValue<int>` or `400` | Sets the update interval. |
| `POST` | `/api/Processing/SelectObserverType` | Body: `JsonSimpleValue<string>` with `name = "ObserverType"` | `JsonSimpleValue<string>`, `400` or `500` | Selects a new observer type. |
| `POST` | `/api/Processing/SetRemoteProcessorSettings` | Body: `RemoteProcessingServiceSettings` | `RemoteProcessingServiceSettings` or `400` | Updates the remote processing configuration. |
| `PUT` | `/api/Processing/ToggleInteractionProcessing` | - | `JsonSimpleValue<bool>` | Starts or stops interaction processing. Name: `IsProcessing`. |

## Network

| Method | Route | Request | Response | Description |
|---|---|---|---|---|
| `GET` | `/api/Network/Status` | - | `NetworkAttributes` | Returns a summarized networking status including address, port, endpoint, and interfaces. |
| `GET` | `/api/Network/IsActive` | - | `bool` | Returns whether server broadcasting is active. |
| `GET` | `/api/Network/GetAddress` | - | `string` | Returns the configured network address. |
| `GET` | `/api/Network/GetPort` | - | `int` | Returns the configured network port. |
| `GET` | `/api/Network/GetEndpoint` | - | `string` | Returns the configured endpoint. |
| `GET` | `/api/Network/GetNetworkType` | - | `uint` | Returns the currently selected interface as a numeric enum value. |
| `GET` | `/api/Network/GetNetworkTypes` | - | `string[]` | Returns all available `NetworkInterface` names. |
| `POST` | `/api/Network/SetPort` | Body: `JsonSimpleValue<int>` with `name = "Port"` | `JsonSimpleValue<int>` or `400` | Sets the network port. |
| `POST` | `/api/Network/SetAddress` | Body: `JsonSimpleValue<string>` with `name = "Address"` | `JsonSimpleValue<string>` or `400` | Sets the network address. |
| `POST` | `/api/Network/SetEndpoint` | Body: `JsonSimpleValue<string>` with `name = "Endpoint"` | `JsonSimpleValue<string>` or `400` | Sets the endpoint. |
| `POST` | `/api/Network/SelectNetworkType` | Body: `JsonSimpleValue<string>` with `name = "NetworkType"` | `JsonSimpleValue<string>`, `400` or `500` | Selects the network interface to use. |
| `POST` | `/api/Network/StartBroadcast` | Body: `NetworkSettings` | `NetworkSettings` | Updates the settings if needed, saves them, and then starts broadcasting. |
| `PUT` | `/api/Network/ToggleNetworking` | - | `JsonSimpleValue<bool>` | Starts or stops networking. Name: `IsBroadcasting`. |
| `PUT` | `/api/Network/Save` | - | `JsonSimpleValue<bool>` | Persists the current networking settings. Name: `SaveSuccessful`. |

## Tuio

| Method | Route | Request | Response | Description |
|---|---|---|---|---|
| `GET` | `/api/Tuio/IsBroadcasting` | - | `JsonSimpleValue<bool>` | Returns whether TUIO broadcasting is active. Name: `IsBroadcasting`. |
| `GET` | `/api/Tuio/GetTuioConfiguration` | - | `TuioConfiguration` | Returns the current TUIO configuration. |
| `GET` | `/api/Tuio/GetTransportProtocols` | - | `string[]` | Returns all available `TransportProtocol` names. |
| `GET` | `/api/Tuio/GetTuioProtocolVersions` | - | `string[]` | Returns all available `ProtocolVersion` names. |
| `GET` | `/api/Tuio/GetTuioInterpretations` | - | `string[]` | Returns all available `TuioInterpretation` names. |
| `POST` | `/api/Tuio/SetPort` | Body: `JsonSimpleValue<int>` with `name = "Port"` | `JsonSimpleValue<int>` or `400` | Sets the TUIO port. |
| `POST` | `/api/Tuio/SetAddress` | Body: `JsonSimpleValue<string>` with `name = "Address"` | `JsonSimpleValue<string>` or `400` | Sets the TUIO address. |
| `POST` | `/api/Tuio/SelectTransportProtocol` | Body: `JsonSimpleValue<string>` with `name = "TransportProtocol"` | `JsonSimpleValue<string>`, `400` or `500` | Selects the transport protocol. |
| `POST` | `/api/Tuio/SelectTuioProtocol` | Body: `JsonSimpleValue<string>` with `name = "ProtocolVersion"` | `JsonSimpleValue<string>`, `400` or `500` | Selects the TUIO protocol version. |
| `POST` | `/api/Tuio/SelectTuioInterpretation` | Body: `JsonSimpleValue<string>` with `name = "TuioInterpretation"` | `JsonSimpleValue<string>`, `400` or `500` | Selects the TUIO interpretation. |
| `PUT` | `/api/Tuio/ToggleBroadcast` | - | `JsonSimpleValue<bool>` | Starts or stops TUIO broadcasting. Name: `IsBroadcasting`. |
| `PUT` | `/api/Tuio/Save` | - | `JsonSimpleValue<bool>` | Persists the current TUIO settings. Name: `SaveSuccessful`. |

## DepthImage

| Method | Route | Request | Response | Description |
|---|---|---|---|---|
| `GET` | `/api/DepthImage/PointCloud` | - | `Point3[]` | Returns the current point cloud or an empty array. |
| `GET` | `/api/DepthImage/VectorField` | - | `Vector2[][]` | Returns the current vector field as a jagged array or an empty array. |

## Log

| Method | Route | Request | Response | Description |
|---|---|---|---|---|
| `GET` | `/api/Log` | - | `LogMessageDetail[]` | Returns the currently buffered log messages. |
| `GET*` | `/api/Log/Messages/{startIndex}` | Path: start index | `LogMessageDetail[]` | Returns log messages starting at a start index. |
| `POST` | `/api/Log/Add` | Body: `JsonSimpleValue<string>` | empty | Writes `value` as an error log entry. |

`GET*`: In the code, `/api/Log/Messages/{startIndex}` does not have `[HttpGet]` set, only `[Route]`. The endpoint is therefore not explicitly restricted to GET, but it is used as a read endpoint.

## VersionInfo

| Method | Route | Request | Response | Description |
|---|---|---|---|---|
| `GET` | `/api/VersionInfo` | - | `AppVersionInfo[]` | Returns the known version information for the application. |

## RecordRawDepth

| Method | Route | Request | Response | Description |
|---|---|---|---|---|
| `GET` | `/api/RecordRawDepth/IsCapturing` | - | `bool` | Returns whether raw data is currently being captured. |
| `GET` | `/api/RecordRawDepth/CurrentRecordId` | - | `int` | Returns the ID of the current or most recent recording. |
| `GET` | `/api/RecordRawDepth/CurrentSampleIdx` | - | `int` | Returns the current sample index within the running recording. |
| `PUT` | `/api/RecordRawDepth/RecordSamples` | Body: `JsonSimpleValue<int>` | `JsonSimpleValue<int>` | Starts a raw data recording with a fixed length of 10 samples to `wwwroot/measurements/{id}`. Return name: `RecordId`. |
