import {
  DepthCameraState,
  PerformanceData,
  TrackingConfigState
} from '@reflex/shared-types';

export const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog')
};

export const settingsService = {
  getSettings: vi.fn().mockName('fakeSettingsService.getSettings'),
  getCanRestore: vi.fn().mockName('fakeSettingsService.getCanRestore'),
  update: vi.fn().mockName('fakeSettingsService.update')
};

export const trackingService = {
  getStatus: vi.fn().mockName('fakeTrackingService.getStatus')
};

export const performanceService = {
  getData: vi.fn().mockName('fakePerformanceService.getData')
};

export const state: TrackingConfigState = {
  isCameraSelected: true,
  selectedCameraName: 'TestCamera',
  selectedConfigurationName: 'TestConfig',
  depthCameraStateName: DepthCameraState[DepthCameraState.Streaming]
};

export const perfData: PerformanceData = {
  data: []
};
