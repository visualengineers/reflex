import { DepthCameraState } from './depthCameraState';
import { CameraConfiguration } from '../config/cameraConfiguration';

export interface IDepthCamera {
  id: string;
  modelDescription: string;
  state: DepthCameraState;
  streamParameter: CameraConfiguration;
}
