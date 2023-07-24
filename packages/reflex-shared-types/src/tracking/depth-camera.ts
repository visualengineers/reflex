import { DepthCameraState } from './depth-camera-state';
import { CameraConfiguration } from '../config/camera-configuration';

export interface DepthCamera {
  id: string;
  modelDescription: string;
  state: DepthCameraState;
  streamParameter: CameraConfiguration;
}
