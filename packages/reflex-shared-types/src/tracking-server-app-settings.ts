import { FilterSettings } from './config/filter-settings';
import { Calibration } from './config/calibration';
import { CameraConfiguration } from './config/camera-configuration';
import { NetworkSettings } from './config/network-settings';
import { ProcessingSettings } from './config/processing-settings';
import { TuioConfiguration } from './config/tuio-configuration';
import { RemoteProcessingServiceSettings } from './config/remote-processing-service-settings';

export interface TrackingServerAppSettings {

  filterSettingValues: FilterSettings;
  calibrationValues: Calibration;
  cameraConfigurationValues: CameraConfiguration;
  networkSettingValues: NetworkSettings;
  processingSettingValues: ProcessingSettings;
  remoteProcessingServiceSettingsValues: RemoteProcessingServiceSettings;
  tuioSettingValues: TuioConfiguration;
  isAutoStartEnabled: boolean;
  defaultCamera: string;
}
