import { Calibration } from './config/calibration';
import { CameraConfiguration } from './config/cameraConfiguration';
import { ExtremumTypeCheckMethod } from './config/extremumTypeCheckMethod';
import { FilterType } from './config/filter-type';
import { FilterSettings } from './config/filterSettings';
import { LimitationFilterType } from './config/limitationFilterType';
import { NetworkInterface } from './config/networkInterface';
import { NetworkSettings } from './config/networkSettings';
import { ObserverType } from './config/observerType';
import { ProcessingSettings } from './config/processingSettings';
import { ProtocolVersion } from './config/protocolVersion';
import { RemoteProcessingAlgorithm } from './config/remote-processing-algorithm';
import { RemoteProcessingServiceSettings } from './config/remote-processing-service-settings';
import { TransportProtocol } from './config/transportProtocol';
import { TuioConfiguration } from './config/tuioConfiguration';
import { TuioInterpretation } from './config/tuioInterpretation';
import { TrackingServerAppSettings } from './trackingServerAppSettings';

const _defaultFilter: FilterSettings = {
  threshold: 0,
  borderValue: { left: 0, right: 0, top: 0, bottom: 0 },
  minDistanceFromSensor: 0,
  limitationFilterType: LimitationFilterType.LimitationFilter,
  advancedLimitationFilterThreshold: 0,
  advancedLimitationFilterSamples: 0,
  isLimitationFilterEnabled: false,
  isValueFilterEnabled: false,
  isThresholdFilterEnabled: false,
  isBoxFilterEnabled: false,
  measurePerformance: false,
  useOptimizedBoxFilter: false,
  boxFilterRadius: 0,
  boxFilterNumPasses: 3,
  boxFilterNumThreads: 16,
  distanceValue: { default: 0, inputDistance: 0, max: 0, min: 0 },
  confidence: { min: 0, max: 30 },
  minAngle: 0,
  smoothingValues: { depthScale: 0, interactionHistorySize: 0, maxNumEmptyFramesBetween: 0, numSmoothingSamples: 0, touchMergeDistance2D: 0, type: FilterType.None },
  extremumSettings: { checkMethod: ExtremumTypeCheckMethod.FixedRadius, checkRadius: 0, fitPercentage: 0, numSamples: 0 }
};

const _defaultCalibration: Calibration = {
  sourceValues: [],
  targetValues: [],
  upperThreshold: 0,
  lowerThreshold: 0,
  lastUpdated: []
};

const _defaultCameraConfig: CameraConfiguration = {
  name: '',
  framerate: 0,
  width: 0,
  height: 0
};

const _defaultNetworkSettings: NetworkSettings = {
  networkInterfaceType: NetworkInterface.None,
  interval: 0,
  address: '',
  port: 0,
  endpoint: ''
};

const _defaultProcessingSettings: ProcessingSettings = {
  interactionType: ObserverType.None,
  intervalDuration: 0
};

const _defaultTuioSettings: TuioConfiguration = {
  sensorWidth: 0,
  sensorHeight: 0,
  sensorDescription: '',
  sessionId: 0,
  serverAddress: '',
  serverPort: 0,
  protocol: ProtocolVersion.TUIO_VERSION_1_1,
  transport: TransportProtocol.Udp,
  interpretation: TuioInterpretation.TouchPoint2DwithPressure
};

const _defaultRemoteProcessingSettings: RemoteProcessingServiceSettings = {
  address: 'http://localhost:50051',
  numSkipValues: 0,
  completeDataSet: false,
  cutOff: 0.1,
  factor: 1200,
  algorithm: RemoteProcessingAlgorithm.Default
};

const _values: TrackingServerAppSettings = {
  filterSettingValues: _defaultFilter,
  calibrationValues: _defaultCalibration,
  cameraConfigurationValues: _defaultCameraConfig,
  networkSettingValues: _defaultNetworkSettings,
  processingSettingValues: _defaultProcessingSettings,
  remoteProcessingServiceSettingsValues: _defaultRemoteProcessingSettings,
  tuioSettingValues: _defaultTuioSettings,
  isAutoStartEnabled: false,
  defaultCamera: ''
};

export const DEFAULT_SETTINGS: TrackingServerAppSettings = _values;
