import { Calibration } from './config/calibration';
import { CameraConfiguration } from './config/camera-configuration';
import { FilterSettings } from './config/filter-settings';
import { NetworkSettings } from './config/network-settings';
import { PointCloudSettings } from './config/point-cloud-settings';
import { ProcessingSettings } from './config/processing-settings';
import { RemoteProcessingServiceSettings } from './config/remote-processing-service-settings';
import { TuioConfiguration } from './config/tuio-configuration';

export interface TrackingServerAppSettings {

  filterSettingValues: FilterSettings;
  calibrationValues: Calibration;
  cameraConfigurationValues: CameraConfiguration;
  networkSettingValues: NetworkSettings;
  pointCloudSettingValues: PointCloudSettings;
  processingSettingValues: ProcessingSettings;
  remoteProcessingServiceSettingsValues: RemoteProcessingServiceSettings;
  tuioSettingValues: TuioConfiguration;
  isAutoStartEnabled: boolean;
  defaultCamera: string;
}
