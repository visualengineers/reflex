import { CameraConfiguration } from '../config/camera-configuration';
import { DepthCameraState } from './depth-camera-state';

export interface DepthCamera {
  id: string;
  modelDescription: string;
  state: DepthCameraState;
  streamParameter: CameraConfiguration;
}
