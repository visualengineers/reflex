import {
  DEFAULT_SETTINGS,
  DepthCamera,
  DepthCameraState,
  TrackingConfigState
} from '@reflex/shared-types';
import { of, throwError } from 'rxjs';
import { mockReturnValueForArgs } from '../../test-utils/mock-return-value-for-args';

export const trackingService = {
  getStatus: vi.fn().mockName('fakeTrackingService.getStatus'),
  getCameras: vi.fn().mockName('fakeTrackingService.getCameras'),
  queryAutostartEnabled: vi
    .fn()
    .mockName('fakeTrackingService.queryAutostartEnabled'),
  getSelectedCamera: vi.fn().mockName('fakeTrackingService.getSelectedCamera'),
  getConfigurationsForCamera: vi
    .fn()
    .mockName('fakeTrackingService.getConfigurationsForCamera'),
  getSelectedCameraConfig: vi
    .fn()
    .mockName('fakeTrackingService.getSelectedCameraConfig'),
  toggleCamera: vi.fn().mockName('fakeTrackingService.toggleCamera'),
  setAutostartEnabled: vi
    .fn()
    .mockName('fakeTrackingService.setAutostartEnabled')
};

export const trackingServiceError = {
  getStatus: vi.fn().mockName('fakeTrackingServiceThrowsErrors.getStatus'),
  getCameras: vi.fn().mockName('fakeTrackingServiceThrowsErrors.getCameras'),
  queryAutostartEnabled: vi
    .fn()
    .mockName('fakeTrackingServiceThrowsErrors.queryAutostartEnabled'),
  getSelectedCamera: vi
    .fn()
    .mockName('fakeTrackingServiceThrowsErrors.getSelectedCamera'),
  getConfigurationsForCamera: vi
    .fn()
    .mockName('fakeTrackingServiceThrowsErrors.getConfigurationsForCamera'),
  getSelectedCameraConfig: vi
    .fn()
    .mockName('fakeTrackingServiceThrowsErrors.getSelectedCameraConfig'),
  toggleCamera: vi
    .fn()
    .mockName('fakeTrackingServiceThrowsErrors.toggleCamera'),
  setAutostartEnabled: vi
    .fn()
    .mockName('fakeTrackingServiceThrowsErrors.setAutostartEnabled')
};

export const camera0: DepthCamera = {
  id: '0',
  modelDescription: 'ZERO',
  state: DepthCameraState.Disconnected,
  streamParameter: {
    name: 'ZeroCam',
    framerate: 0,
    width: 10,
    height: 5
  }
};

export const camera1: DepthCamera = {
  id: '1',
  modelDescription: 'TestCamera',
  state: DepthCameraState.Streaming,
  streamParameter: {
    name: 'TestConfig',
    framerate: 30,
    width: 100,
    height: 50
  }
};

export const camera2: DepthCamera = {
  id: '2',
  modelDescription: 'AnotherCam',
  state: DepthCameraState.Connected,
  streamParameter: {
    name: 'AnotherConfig',
    framerate: 60,
    width: 640,
    height: 480
  }
};

export const state: TrackingConfigState = {
  isCameraSelected: true,
  selectedCameraName: 'TestCamera',
  selectedConfigurationName: 'TestConfig',
  depthCameraStateName: DepthCameraState[camera1.state]
};

export const state2: TrackingConfigState = {
  isCameraSelected: true,
  selectedCameraName: 'ZERO',
  selectedConfigurationName: '',
  depthCameraStateName: DepthCameraState[camera0.state]
};

trackingService.getCameras.mockReturnValue(of([camera0, camera1, camera2]));

trackingService.queryAutostartEnabled.mockReturnValue(of('true'));

trackingService.getStatus.mockReturnValue(of(state));

trackingService.getSelectedCamera.mockReturnValue(of(camera1));

mockReturnValueForArgs(trackingService.getConfigurationsForCamera, [1], of([camera1.streamParameter]));

mockReturnValueForArgs(trackingService.getConfigurationsForCamera, [0], of([camera2.streamParameter, camera0.streamParameter]));

trackingService.getSelectedCameraConfig.mockReturnValue(
  of(camera1.streamParameter)
);

export const errorCam = 'TestError: getCameras()';

trackingServiceError.getCameras.mockReturnValue(throwError(errorCam));

export const errorAutostart = 'TestError: queryAutostartEnabled()';

trackingServiceError.queryAutostartEnabled.mockReturnValue(
  throwError(errorAutostart)
);

export const errorStatus = 'TestError: getStatus()';

trackingServiceError.getStatus.mockReturnValue(throwError(errorStatus));

export const errorSelectCam = 'TestError: getSelectedCamera()';

trackingServiceError.getSelectedCamera.mockReturnValue(
  throwError(errorSelectCam)
);

export const errorConfigCam = 'TestError: getConfigurationsForCamera()';

trackingServiceError.getConfigurationsForCamera.mockReturnValue(
  throwError(errorConfigCam)
);

export const errorSelectConfig = 'TestError: getSelectedCameraConfig()';

trackingServiceError.getSelectedCameraConfig.mockReturnValue(
  throwError(errorSelectConfig)
);

export const errorToggle = 'TestError: toggleCamera()';

trackingServiceError.toggleCamera.mockReturnValue(throwError(errorToggle));

export const errorSaveAutoStart = 'TestError: setAutostartEnabled()';

trackingServiceError.setAutostartEnabled.mockReturnValue(
  throwError(errorSaveAutoStart)
);

export const settingsService = {
  getSettings: vi.fn().mockName('fakeSettingsService.getSettings'),
  getCanRestore: vi.fn().mockName('fakeSettingsService.getCanRestore'),
  update: vi.fn().mockName('fakeSettingsService.update')
};

export const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog')
};

settingsService.getSettings.mockReturnValue(of(DEFAULT_SETTINGS));

settingsService.getCanRestore.mockReturnValue(
  of({ name: 'canRestore', value: true })
);
