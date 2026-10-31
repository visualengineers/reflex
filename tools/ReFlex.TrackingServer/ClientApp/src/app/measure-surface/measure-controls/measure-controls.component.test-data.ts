
export const measureService = {
  isCapturing: vi.fn().mockName('fakeMeasureService.isCapturing'),
  getCurrentSampleIdx: vi
    .fn()
    .mockName('fakeMeasureService.getCurrentSampleIdx'),
  startCapture: vi.fn().mockName('fakeMeasureService.startCapture')
};

export const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog')
};
