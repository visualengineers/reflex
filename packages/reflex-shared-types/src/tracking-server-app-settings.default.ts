import { Calibration } from './config/calibration';
import { CameraConfiguration } from './config/camera-configuration';
import { ExtremumTypeCheckMethod } from './config/extremum-type-check-method';
import { FilterType } from './config/filter-type';
import { FilterSettings } from './config/filter-settings';
import { LimitationFilterType } from './config/limitation-flter-type';
import { NetworkInterface } from './config/network-interface';
import { NetworkSettings } from './config/network-settings';
import { ObserverType } from './config/observer-type';
import { ProcessingSettings } from './config/processing-settings';
import { ProtocolVersion } from './config/protocol-version';
import { RemoteProcessingAlgorithm } from './config/remote-processing-algorithm';
import { RemoteProcessingServiceSettings } from './config/remote-processing-service-settings';
import { TransportProtocol } from './config/transport-protocol';
import { TuioConfiguration } from './config/tuio-configuration';
import { TuioInterpretation } from './config/tuio-interpretation';
import { TrackingServerAppSettings } from './tracking-server-app-settings';
import { PredictionSettings } from './config/prediction-settings';

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

const _defaultPredictionSettings: PredictionSettings = {
  useVelocityPrediction: true,
  numFramesForPrediction: 2,
  secondDerivationMagnitude: 0.5,
  useSecondDerivation: false,
  filterPointsByVelocity: true,
  velocityFilterThreshold: 5
}

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
  predictionSettings: _defaultPredictionSettings,
  remoteProcessingServiceSettingsValues: _defaultRemoteProcessingSettings,
  tuioSettingValues: _defaultTuioSettings,
  isAutoStartEnabled: false,
  defaultCamera: ''
};

export const DEFAULT_SETTINGS: TrackingServerAppSettings = _values;
