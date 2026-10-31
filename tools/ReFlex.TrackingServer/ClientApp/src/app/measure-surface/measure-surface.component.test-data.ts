import { FrameSizeDefinition } from '@reflex/shared-types';

export const calibrationService = {
  getFrameSize: vi.fn().mockName('fakeCalibrationService.getFrameSize')
};

export const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog')
};

export const customFrame: FrameSizeDefinition = {
  width: 500,
  height: 400,
  left: 150,
  top: 75
};
