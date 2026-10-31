import {
  CompleteInteractionData,
  FrameSizeDefinition,
  RemoteProcessingAlgorithm,
  RemoteProcessingServiceSettings
} from '@reflex/shared-types';

export const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog')
};

export const settingsService = {
  getSettings: vi.fn().mockName('fakeSettingsService.getSettings'),
  saveSettings: vi.fn().mockName('fakeSettingsService.saveSettings')
};

export const calibrationService = {
  computeCalibratedAbsolutePosition: vi
    .fn()
    .mockName('fakeCalibrationService.computeCalibratedAbsolutePosition'),
  getFrameSize: vi.fn().mockName('fakeCalibrationService.getFrameSize')
};

export const processingService = {
  getFrames: vi.fn().mockName('fakeProcessingService.getFrames'),
  getStatus: vi.fn().mockName('fakeProcessingService.getStatus'),
  getObserverTypes: vi.fn().mockName('fakeProcessingService.getObserverTypes'),
  getSelectedObserverType: vi
    .fn()
    .mockName('fakeProcessingService.getSelectedObserverType'),
  getHistory: vi.fn().mockName('fakeProcessingService.getHistory'),
  getInteractions: vi.fn().mockName('fakeProcessingService.getInteractions'),
  getInterval: vi.fn().mockName('fakeProcessingService.getInterval'),
  getRemoteProcessorSettings: vi
    .fn()
    .mockName('fakeProcessingService.getRemoteProcessorSettings'),
  setRemoteProcessorSettings: vi
    .fn()
    .mockName('fakeProcessingService.setRemoteProcessorSettings')
};

export const customFrame: FrameSizeDefinition = {
  width: 500,
  height: 400,
  left: 150,
  top: 75
};

export const interactionData: CompleteInteractionData = {
  raw: [],
  normalized: [],
  absolute: []
};

export const observerTypes = ['None', 'TestObserver', 'RealObserver'];

export const remoteObserver: RemoteProcessingServiceSettings = {
  address: 'http://localhost:50051',
  numSkipValues: 0,
  completeDataSet: false,
  useGzipCompression: true,
  cutOff: 0,
  factor: 0,
  algorithm: RemoteProcessingAlgorithm.Default
};
