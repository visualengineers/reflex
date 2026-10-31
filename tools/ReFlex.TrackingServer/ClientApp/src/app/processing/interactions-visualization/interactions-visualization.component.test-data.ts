import {
  CompleteInteractionData,
  FrameSizeDefinition
} from '@reflex/shared-types';

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

export const testInteractionData: CompleteInteractionData = {
  raw: [
    {
      touchId: 0,
      confidence: 10,
      time: 1234567,
      type: 0,
      extremumDescription: {
        type: 0,
        numFittingPoints: 10,
        percentageFittingPoints: 100
      },
      position: { x: 100, y: 150, z: 30, isFiltered: false, isValid: true }
    },
    {
      touchId: 1,
      confidence: 5,
      time: 13343434242,
      type: 1,
      extremumDescription: {
        type: 1,
        numFittingPoints: 5,
        percentageFittingPoints: 90
      },
      position: { x: 200, y: 50, z: -30, isFiltered: false, isValid: true }
    },
    {
      touchId: 2,
      confidence: 15,
      time: 54654646,
      type: 2,
      extremumDescription: {
        type: 2,
        numFittingPoints: 1,
        percentageFittingPoints: 10
      },
      position: { x: 300, y: 450, z: 0, isFiltered: false, isValid: true }
    }
  ],
  normalized: [
    {
      touchId: 0,
      confidence: 10,
      time: 1234567,
      type: 0,
      extremumDescription: {
        type: 0,
        numFittingPoints: 10,
        percentageFittingPoints: 100
      },
      position: { x: 0.1, y: 0.15, z: 0.3, isFiltered: false, isValid: true }
    },
    {
      touchId: 1,
      confidence: 5,
      time: 13343434242,
      type: 1,
      extremumDescription: {
        type: 1,
        numFittingPoints: 5,
        percentageFittingPoints: 90
      },
      position: { x: 0.2, y: 0.05, z: -0.3, isFiltered: false, isValid: true }
    },
    {
      touchId: 2,
      confidence: 15,
      time: 54654646,
      type: 2,
      extremumDescription: {
        type: 2,
        numFittingPoints: 1,
        percentageFittingPoints: 10
      },
      position: { x: 0.3, y: 0.45, z: 0, isFiltered: false, isValid: true }
    }
  ],
  absolute: [
    {
      touchId: 0,
      confidence: 10,
      time: 1234567,
      type: 0,
      extremumDescription: {
        type: 0,
        numFittingPoints: 10,
        percentageFittingPoints: 100
      },
      position: { x: 200, y: 300, z: 60, isFiltered: false, isValid: true }
    },
    {
      touchId: 1,
      confidence: 5,
      time: 13343434242,
      type: 1,
      extremumDescription: {
        type: 1,
        numFittingPoints: 5,
        percentageFittingPoints: 90
      },
      position: { x: 400, y: 100, z: -60, isFiltered: false, isValid: true }
    },
    {
      touchId: 2,
      confidence: 15,
      time: 54654646,
      type: 2,
      extremumDescription: {
        type: 2,
        numFittingPoints: 1,
        percentageFittingPoints: 10
      },
      position: { x: 600, y: 900, z: 0, isFiltered: false, isValid: true }
    }
  ]
};
