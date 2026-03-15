# ReFlex TrackingServer REST API

## Hinweise

- Basisroute fuer die REST-Endpunkte ist in der Regel `/api/{Controller}`.
- Einige Endpunkte erwarten primitive JSON-Werte im Body, also z. B. `true`, `3` oder `"recording-01"`.
- Viele Schreib-Endpunkte verwenden `JsonSimpleValue<T>` im Format `{"name":"Port","value":9000}`. Bei den in der Tabelle markierten Endpunkten muss `name` exakt dem angegebenen Wert entsprechen, sonst antwortet der Controller mit `400 Bad Request`.
- `PUT /api/Tracking/{id}` und `PUT /api/Tracking/Configuration/{id}` haben zwar einen Body-Parameter, werten ihn im Controller aber nicht aus.
- Der WebSocket-Endpunkt `GET /ReFlex` ist kein REST-Endpunkt und daher hier nicht Teil der Tabelle.

## Calibration

| Methode | Route | Request | Response | Beschreibung |
|---|---|---|---|---|
| `GET` | `/api/Calibration/FrameSize` | - | `FrameSizeDefinition` | Liefert die aktuelle Fenster-/Frame-Groesse der Kalibrierung. |
| `GET` | `/api/Calibration/SourceValues` | - | `CalibrationPoint[]` | Liefert die Quellpunkte der Kalibrierung. |
| `GET` | `/api/Calibration/TargetValues` | - | `CalibrationPoint[]` | Liefert die Zielpunkte der Kalibrierung. |
| `GET` | `/api/Calibration/GetCalibrationMatrix` | - | `CalibrationTransform` | Berechnet die Transformationsmatrix neu und gibt sie zurueck. |
| `GET` | `/api/Calibration/ApplyCalibration` | - | `CalibrationTransform` | Berechnet die Transformationsmatrix und gibt sie zurueck. |
| `GET` | `/api/Calibration/Restart` | - | `CalibrationTransform` | Setzt den Kalibrierungsprozess zurueck und liefert die aktuelle Matrix. |
| `GET` | `/api/Calibration/SaveCalibration` | - | `CalibrationTransform` | Schliesst die Kalibrierung ab und liefert die gespeicherte Matrix. |
| `POST` | `/api/Calibration/UpdateFrameSize` | Body: `FrameSizeDefinition` | `FrameSizeDefinition` oder `400` | Setzt die Fenster-/Frame-Groesse fuer die Kalibrierung. |
| `POST` | `/api/Calibration/UpdateCalibrationPoint/{index}` | Pfad: `index` (`0..2`), Body: `CalibrationPoint` | `CalibrationTransform` oder `400` | Aktualisiert einen bestehenden Zielpunkt und liefert die resultierende Matrix. |
| `POST` | `/api/Calibration/AddCalibrationPoint` | Body: `CalibrationPoint` | `CalibrationTransform` oder `400` | Fuegt einen weiteren Kalibrierungspunkt hinzu. |
| `POST` | `/api/Calibration/CalibratedInteractions` | Body: `Interaction[]` | `Interaction[]` oder `400` | Kalibriert ein Interaktions-Array und gibt die kalibrierten Werte zurueck. |

## Tracking

| Methode | Route | Request | Response | Beschreibung |
|---|---|---|---|---|
| `GET` | `/api/Tracking` | - | `IDepthCamera[]` | Liefert alle verfuegbaren Kameras. |
| `GET` | `/api/Tracking/SelectedCamera` | - | `IDepthCamera` | Liefert die aktuell ausgewaehlte Kamera. |
| `GET` | `/api/Tracking/SelectedCameraConfig` | - | `StreamParameter` | Liefert die aktuell ausgewaehlte Kamerakonfiguration. |
| `GET` | `/api/Tracking/Configurations/{id}` | Pfad: Kamera-ID | `StreamParameter[]` | Liefert die verfuegbaren Konfigurationen fuer eine Kamera. |
| `GET` | `/api/Tracking/{id}` | Pfad: Kamera-ID | `IDepthCamera` oder `null` | Liefert eine einzelne Kamera anhand ihrer ID. |
| `GET` | `/api/Tracking/Status` | - | `TrackingConfigState` oder `null` | Liefert den aktuellen Tracking-Status. |
| `PUT` | `/api/Tracking/{id}` | Pfad: Kamera-ID, Body: JSON-String (ungenutzt) | leer | Waehlt eine Kamera per ID aus. |
| `PUT` | `/api/Tracking/Configuration/{id}` | Pfad: Konfigurations-ID, Body: JSON-String (ungenutzt) | leer | Waehlt eine Kamerakonfiguration per ID aus. |
| `PUT` | `/api/Tracking/ToggleTracking/{id}` | Pfad: Kamera-ID, Body: JSON-Integer `configIdx` | `202 Accepted` | Startet oder stoppt das Tracking fuer Kamera und Konfiguration. |
| `PUT` | `/api/Tracking/SetDepthImagePreview` | Body: JSON-Boolean | `202 Accepted` | Aktiviert oder deaktiviert den Raw-Depth-Preview-Stream. |
| `PUT` | `/api/Tracking/SetDepthImagePointCloudPreview` | Body: JSON-Boolean | `202 Accepted` | Aktiviert oder deaktiviert den Point-Cloud-Preview-Stream. |
| `GET` | `/api/Tracking/Recordings` | - | `StreamParameter[]` | Liefert die vorhandenen Recording-Konfigurationen. |
| `PUT` | `/api/Tracking/StartRecording` | Body: JSON-String `name` | `string` oder `403` | Startet eine Aufnahme der aktuell streamenden Kamera. |
| `GET` | `/api/Tracking/StopRecording` | - | `string` | Stoppt die laufende Aufnahme und liefert das Recorder-Ergebnis. |
| `PUT` | `/api/Tracking/DeleteRecording` | Body: JSON-String `name` | `bool` | Loescht eine benannte Aufnahme. |
| `GET` | `/api/Tracking/ClearRecordings` | - | `string` | Loescht alle Aufnahmen und liefert die Anzahl geloeschter Eintraege als String. |
| `GET` | `/api/Tracking/RecordingState` | - | `bool` | Gibt an, ob aktuell aufgenommen wird. |
| `GET` | `/api/Tracking/RecordingFrameCount/{name}` | Pfad: Aufnahme-Name | `int` | Liefert die Anzahl gespeicherter Frames einer Aufnahme. |
| `GET` | `/api/Tracking/GetAutostartEnabled` | - | `bool` | Liefert den aktuellen Auto-Start-Status. |
| `PUT` | `/api/Tracking/SetAutostart` | Body: JSON-Boolean | `bool` | Setzt den Auto-Start-Status. |

## Settings

| Methode | Route | Request | Response | Beschreibung |
|---|---|---|---|---|
| `GET` | `/api/Settings` | - | `TrackingServerAppSettings` | Liefert die komplette aktuelle Server-Konfiguration. |
| `POST` | `/api/Settings` | Body: `TrackingServerAppSettings` | leer | Uebernimmt und speichert die komplette Konfiguration. |
| `GET` | `/api/Settings/CanRestore` | - | `JsonSimpleValue<bool>` | Liefert, ob ein Backup fuer Restore verfuegbar ist. Name: `CanRestoreBackup`. |
| `GET` | `/api/Settings/Restore` | - | `TrackingServerAppSettings` | Stellt die letzte Sicherung wieder her. |
| `GET` | `/api/Settings/Reset` | - | `TrackingServerAppSettings` | Setzt die Konfiguration auf Defaults zurueck. |
| `POST` | `/api/Settings/Border` | Body: `Border` | `Border` | Aktualisiert die Border-Einstellungen. |
| `POST` | `/api/Settings/MinDistanceFromSensor` | Body: JSON-Float | `float` | Setzt den minimalen Sensorabstand. |
| `POST` | `/api/Settings/Threshold` | Body: JSON-Float | `JsonSimpleValue<float>` | Setzt den Threshold. Rueckgabe-Name: `Threshold`. |
| `POST` | `/api/Settings/MinAngle` | Body: JSON-Float | `JsonSimpleValue<float>` | Setzt den Minimalwinkel. Rueckgabe-Name: `MinAngle`. |
| `GET` | `/api/Settings/ComputeZeroPlaneDistance` | - | `Distance` | Berechnet die Zero-Plane-Distanz neu und speichert sie als Default. |
| `GET` | `/api/Settings/ResetAdvancedLimitationFilter` | - | `JsonSimpleValue<bool>` | Setzt den Limitation Filter zurueck. Rueckgabe-Name: `Success`. |
| `GET` | `/api/Settings/InitializeAdvancedLimitationFilter` | - | `JsonSimpleValue<bool>` | Initialisiert den erweiterten Limitation Filter. Rueckgabe-Name: `Success`. |
| `GET` | `/api/Settings/LimitationFilterInitializing` | - | `JsonSimpleValue<bool>` | Liefert den Initialisierungsstatus des Limitation Filters. Name: `IsInitializing`. |
| `GET` | `/api/Settings/LimitationFilterInitState` | - | `JsonSimpleValue<bool>` | Liefert, ob der Limitation Filter initialisiert ist. Name: `IsInitialized`. |
| `POST` | `/api/Settings/LimitationFilterType` | Body: `FilterSettings` | `JsonSimpleValue<bool>` | Aktualisiert mehrere Limitation-/Filter-Einstellungen gesammelt. Rueckgabe: `{name:"success", value:true}`. |
| `GET` | `/api/Settings/MeasurePerformance` | - | `JsonSimpleValue<bool>` | Liefert, ob Performance-Messung aktiv ist. Name: `MeasurePerformance`. |
| `POST` | `/api/Settings/MeasurePerformance` | Body: `JsonSimpleValue<bool>` | `JsonSimpleValue<bool>` | Setzt die Performance-Messung. Nur `value` wird verwendet; Rueckgabe: `{name:"success", value:true}`. |
| `POST` | `/api/Settings/Distance` | Body: `Distance` | `Distance` | Aktualisiert die Distanz-Einstellungen. |
| `POST` | `/api/Settings/Confidence` | Body: `ConfidenceParameter` | `ConfidenceParameter` | Aktualisiert die Confidence-Einstellungen. |
| `PUT` | `/api/Settings/FilterRadius/{radius}` | Pfad: `radius` | `JsonSimpleValue<int>` | Setzt den Box-Filter-Radius. Name: `BoxFilterRadius`. |
| `PUT` | `/api/Settings/FilterPasses/{numPasses}` | Pfad: `numPasses` | `JsonSimpleValue<int>` | Setzt die Anzahl der Box-Filter-Durchlaeufe. Name: `BoxFilterNumPasses`. |
| `PUT` | `/api/Settings/FilterThreads/{numThreads}` | Pfad: `numThreads` | `JsonSimpleValue<int>` | Setzt die Anzahl der Box-Filter-Threads. Name: `BoxFilterNumThreads`. |
| `POST` | `/api/Settings/UseOptimizedBoxFilter` | Body: `JsonSimpleValue<bool>` | `JsonSimpleValue<bool>` | Aktiviert oder deaktiviert den optimierten Box-Filter. Nur `value` wird verwendet. |
| `POST` | `/api/Settings/Smoothing` | Body: `SmoothingParameter` | `SmoothingParameter` | Aktualisiert die Smoothing-Einstellungen. |
| `POST` | `/api/Settings/ExtremumsCheck` | Body: `ExtremumDescriptionSettings` | `ExtremumDescriptionSettings` | Aktualisiert die Extremum-Erkennung. |
| `POST` | `/api/Settings/PointCloudSettings` | Body: `PointCloudSettings` | `PointCloudSettings` | Aktualisiert die Point-Cloud-Einstellungen. |
| `POST` | `/api/Settings/LoadSettings` | Body: `TrackingServerAppSettings` | `TrackingServerAppSettings` | Laedt Client-seitige Settings in den Serverzustand. |

## Processing

| Methode | Route | Request | Response | Beschreibung |
|---|---|---|---|---|
| `GET` | `/api/Processing/IsLoopRunning` | - | `JsonSimpleValue<bool>` | Liefert, ob die Verarbeitungs-Schleife laeuft. Name: `IsLoopRunning`. |
| `GET` | `/api/Processing/GetInterval` | - | `int` | Liefert das aktuelle Update-Intervall in Millisekunden. |
| `GET` | `/api/Processing/GetRemoteProcessorSettings` | - | `RemoteProcessingServiceSettings` | Liefert die Remote-Processing-Konfiguration. |
| `GET` | `/api/Processing/GetObserverType` | - | `uint` | Liefert den aktuell gesetzten `ObserverType` als numerischen Enum-Wert. |
| `GET` | `/api/Processing/GetObserverTypes` | - | `string[]` | Liefert alle verfuegbaren `ObserverType`-Namen. |
| `POST` | `/api/Processing/SetUpdateInterval` | Body: `JsonSimpleValue<int>` mit `name = "UpdateInterval"` | `JsonSimpleValue<int>` oder `400` | Setzt das Update-Intervall. |
| `POST` | `/api/Processing/SetRemoteProcessorSettings` | Body: `RemoteProcessingServiceSettings` | `RemoteProcessingServiceSettings` oder `400` | Aktualisiert die Remote-Processing-Konfiguration. |
| `POST` | `/api/Processing/SelectObserverType` | Body: `JsonSimpleValue<string>` mit `name = "ObserverType"` | `JsonSimpleValue<string>`, `400` oder `500` | Waehlt einen neuen Observer-Typ. |
| `PUT` | `/api/Processing/ToggleInteractionProcessing` | - | `JsonSimpleValue<bool>` | Startet oder stoppt die Interaktionsverarbeitung. Name: `IsProcessing`. |

## Network

| Methode | Route | Request | Response | Beschreibung |
|---|---|---|---|---|
| `GET` | `/api/Network/Status` | - | `NetworkAttributes` | Liefert einen zusammengefassten Networking-Status inklusive Adresse, Port, Endpoint und Interfaces. |
| `GET` | `/api/Network/IsActive` | - | `bool` | Liefert, ob das Server-Broadcasting aktiv ist. |
| `GET` | `/api/Network/GetAddress` | - | `string` | Liefert die konfigurierte Netzwerkadresse. |
| `GET` | `/api/Network/GetPort` | - | `int` | Liefert den konfigurierten Netzwerkport. |
| `GET` | `/api/Network/GetEndpoint` | - | `string` | Liefert den konfigurierten Endpoint. |
| `GET` | `/api/Network/GetNetworkType` | - | `uint` | Liefert das aktuell gewaehlte Interface als numerischen Enum-Wert. |
| `GET` | `/api/Network/GetNetworkTypes` | - | `string[]` | Liefert alle verfuegbaren `NetworkInterface`-Namen. |
| `POST` | `/api/Network/SetPort` | Body: `JsonSimpleValue<int>` mit `name = "Port"` | `JsonSimpleValue<int>` oder `400` | Setzt den Netzwerkport. |
| `POST` | `/api/Network/SetAddress` | Body: `JsonSimpleValue<string>` mit `name = "Address"` | `JsonSimpleValue<string>` oder `400` | Setzt die Netzwerkadresse. |
| `POST` | `/api/Network/SetEndpoint` | Body: `JsonSimpleValue<string>` mit `name = "Endpoint"` | `JsonSimpleValue<string>` oder `400` | Setzt den Endpoint. |
| `POST` | `/api/Network/SelectNetworkType` | Body: `JsonSimpleValue<string>` mit `name = "NetworkType"` | `JsonSimpleValue<string>`, `400` oder `500` | Waehlt das zu nutzende Netzwerk-Interface. |
| `POST` | `/api/Network/StartBroadcast` | Body: `NetworkSettings` | `NetworkSettings` | Aktualisiert bei Bedarf die Settings, speichert sie und startet anschliessend das Broadcasting. |
| `PUT` | `/api/Network/ToggleNetworking` | - | `JsonSimpleValue<bool>` | Startet oder stoppt das Networking. Name: `IsBroadcasting`. |
| `PUT` | `/api/Network/Save` | - | `JsonSimpleValue<bool>` | Persistiert die aktuellen Networking-Einstellungen. Name: `SaveSuccessful`. |

## Tuio

| Methode | Route | Request | Response | Beschreibung |
|---|---|---|---|---|
| `GET` | `/api/Tuio/IsBroadcasting` | - | `JsonSimpleValue<bool>` | Liefert, ob TUIO-Broadcasting aktiv ist. Name: `IsBroadcasting`. |
| `GET` | `/api/Tuio/GetTuioConfiguration` | - | `TuioConfiguration` | Liefert die aktuelle TUIO-Konfiguration. |
| `GET` | `/api/Tuio/GetTransportProtocols` | - | `string[]` | Liefert alle verfuegbaren `TransportProtocol`-Namen. |
| `GET` | `/api/Tuio/GetTuioProtocolVersions` | - | `string[]` | Liefert alle verfuegbaren `ProtocolVersion`-Namen. |
| `GET` | `/api/Tuio/GetTuioInterpretations` | - | `string[]` | Liefert alle verfuegbaren `TuioInterpretation`-Namen. |
| `POST` | `/api/Tuio/SetPort` | Body: `JsonSimpleValue<int>` mit `name = "Port"` | `JsonSimpleValue<int>` oder `400` | Setzt den TUIO-Port. |
| `POST` | `/api/Tuio/SetAddress` | Body: `JsonSimpleValue<string>` mit `name = "Address"` | `JsonSimpleValue<string>` oder `400` | Setzt die TUIO-Adresse. |
| `POST` | `/api/Tuio/SelectTransportProtocol` | Body: `JsonSimpleValue<string>` mit `name = "TransportProtocol"` | `JsonSimpleValue<string>`, `400` oder `500` | Waehlt das Transportprotokoll. |
| `POST` | `/api/Tuio/SelectTuioProtocol` | Body: `JsonSimpleValue<string>` mit `name = "ProtocolVersion"` | `JsonSimpleValue<string>`, `400` oder `500` | Waehlt die TUIO-Protokollversion. |
| `POST` | `/api/Tuio/SelectTuioInterpretation` | Body: `JsonSimpleValue<string>` mit `name = "TuioInterpretation"` | `JsonSimpleValue<string>`, `400` oder `500` | Waehlt die TUIO-Interpretation. |
| `PUT` | `/api/Tuio/ToggleBroadcast` | - | `JsonSimpleValue<bool>` | Startet oder stoppt das TUIO-Broadcasting. Name: `IsBroadcasting`. |
| `PUT` | `/api/Tuio/Save` | - | `JsonSimpleValue<bool>` | Persistiert die aktuellen TUIO-Einstellungen. Name: `SaveSuccessful`. |

## DepthImage

| Methode | Route | Request | Response | Beschreibung |
|---|---|---|---|---|
| `GET` | `/api/DepthImage/PointCloud` | - | `Point3[]` | Liefert die aktuelle Point Cloud oder ein leeres Array. |
| `GET` | `/api/DepthImage/VectorField` | - | `Vector2[][]` | Liefert das aktuelle Vector Field als Jagged Array oder ein leeres Array. |

## Log

| Methode | Route | Request | Response | Beschreibung |
|---|---|---|---|---|
| `GET` | `/api/Log` | - | `LogMessageDetail[]` | Liefert die aktuell gepufferten Log-Meldungen. |
| `GET*` | `/api/Log/Messages/{startIndex}` | Pfad: Startindex | `LogMessageDetail[]` | Liefert Log-Meldungen ab einem Startindex. |
| `POST` | `/api/Log/Add` | Body: `JsonSimpleValue<string>` | leer | Schreibt `value` als Error-Logeintrag. |

`GET*`: Im Code ist fuer `/api/Log/Messages/{startIndex}` kein `[HttpGet]` gesetzt, sondern nur `[Route]`. Der Endpunkt ist damit nicht explizit auf GET eingeschraenkt, wird aber als Lese-Endpunkt verwendet.

## VersionInfo

| Methode | Route | Request | Response | Beschreibung |
|---|---|---|---|---|
| `GET` | `/api/VersionInfo` | - | `AppVersionInfo[]` | Liefert die bekannten Versionsinformationen der Anwendung. |

## RecordRawDepth

| Methode | Route | Request | Response | Beschreibung |
|---|---|---|---|---|
| `GET` | `/api/RecordRawDepth/IsCapturing` | - | `bool` | Liefert, ob gerade Rohdaten aufgenommen werden. |
| `GET` | `/api/RecordRawDepth/CurrentRecordId` | - | `int` | Liefert die ID der aktuellen oder letzten Aufnahme. |
| `GET` | `/api/RecordRawDepth/CurrentSampleIdx` | - | `int` | Liefert den aktuellen Sample-Index innerhalb der laufenden Aufnahme. |
| `PUT` | `/api/RecordRawDepth/RecordSamples` | Body: `JsonSimpleValue<int>` | `JsonSimpleValue<int>` | Startet eine Rohdatenaufnahme mit fester Laenge von 10 Samples nach `wwwroot/measurements/{id}`. Rueckgabe-Name: `RecordId`. |
