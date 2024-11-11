import { FilterSettings } from './config/filter-settings';
import { Calibration } from './config/calibration';
import { CameraConfiguration } from './config/camera-configuration';
import { NetworkSettings } from './config/network-settings';
import { ProcessingSettings } from './config/processing-settings';
import { TuioConfiguration } from './config/tuio-configuration';
import { RemoteProcessingServiceSettings } from './config/remote-processing-service-settings';
import { PredictionSettings } from './config/prediction-settings';

export interface TrackingServerAppSettings {

  filterSettingValues: FilterSettings;
  calibrationValues: Calibration;
  cameraConfigurationValues: CameraConfiguration;
  networkSettingValues: NetworkSettings;
  processingSettingValues: ProcessingSettings;
  predictionSettings: PredictionSettings;
  remoteProcessingServiceSettingsValues: RemoteProcessingServiceSettings;
  tuioSettingValues: TuioConfiguration;
  isAutoStartEnabled: boolean;
  defaultCamera: string;
}
