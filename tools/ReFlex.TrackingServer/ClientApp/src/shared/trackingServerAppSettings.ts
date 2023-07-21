import { FilterSettings } from './config/filterSettings';
import { Calibration } from './config/calibration';
import { CameraConfiguration } from './config/cameraConfiguration';
import { NetworkSettings } from './config/networkSettings';
import { ProcessingSettings } from './config/processingSettings';
import { TuioConfiguration } from './config/tuioConfiguration';
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
