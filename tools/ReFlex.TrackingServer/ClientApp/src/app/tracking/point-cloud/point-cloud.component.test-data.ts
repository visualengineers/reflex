import {
  DepthCameraState,
  Point3,
  TrackingConfigState
} from '@reflex/shared-types';

export const trackingService = {
  getStatus: vi.fn().mockName('fakeTrackingService.getStatus')
};

export const pointCloudService = {
  getPointCloud: vi.fn().mockName('fakePointCloudService.getPointCloud')
};

export const processingService = {
  getInteractions: vi
    .fn()
    .mockName('fakeProcessingCloudService.getInteractions')
};

export const settingsService = {
  getSettings: vi.fn().mockName('fakeSettingsService.getSettings')
};

export const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog')
};


export const state: TrackingConfigState = {
  isCameraSelected: true,
  selectedCameraName: 'TestCamera',
  selectedConfigurationName: 'TestConfig',
  depthCameraStateName: DepthCameraState[DepthCameraState.Streaming]
};

export const dummyPoints = new Array<Point3>();

for (let i = 0; i < 100; i++) {
  const pt = {
    x: i,
    y: -i,
    z: i + (1 / i),
    isFiltered: i < 10 || i > 90,
    isValid: i % 2 === 0
  };

  dummyPoints.push(pt);
}
