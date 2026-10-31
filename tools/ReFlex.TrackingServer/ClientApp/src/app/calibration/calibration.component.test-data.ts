import {
  CalibrationPoint,
  CalibrationTransform,
  CompleteInteractionData,
  FrameSizeDefinition,
  Interaction
} from '@reflex/shared-types';

export const calibrationService = {
  getCalibrationMatrix: vi
    .fn()
    .mockName('fakeCalibrationService.getCalibrationMatrix'),
  getCalibrationSourcePoints: vi
    .fn()
    .mockName('fakeCalibrationService.getCalibrationSourcePoints'),
  getCurrentCalibrationTargetPoints: vi
    .fn()
    .mockName('fakeCalibrationService.getCurrentCalibrationTargetPoints'),
  getFrameSize: vi.fn().mockName('fakeCalibrationService.getFrameSize'),
  computeCalibratedAbsolutePosition: vi
    .fn()
    .mockName('fakeCalibrationService.computeCalibratedAbsolutePosition'),
  updateCalibrationPoint: vi
    .fn()
    .mockName('fakeCalibrationService.updateCalibrationPoint'),
  restartCalibration: vi
    .fn()
    .mockName('fakeCalibrationService.restartCalibration'),
  applyCalibration: vi.fn().mockName('fakeCalibrationService.applyCalibration'),
  saveCalibration: vi.fn().mockName('fakeCalibrationService.saveCalibration'),
  updateFrameSize: vi.fn().mockName('fakeCalibrationService.updateFrameSize')
};

export const processingService = {
  getStatus: vi.fn().mockName('fakeProcessingCloudService.getStatus'),
  getInteractions: vi
    .fn()
    .mockName('fakeProcessingCloudService.getInteractions')
};

export const settingsService = {
  getSettings: vi.fn().mockName('fakeSettingsService.getSettings'),
  update: vi.fn().mockName('fakeSettingsService.update')
};

export const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog')
};

export const defaultInteractionData: CompleteInteractionData = {
  raw: [],
  normalized: [],
  absolute: []
};

export const defaultSelectedInteraction: Interaction = {
  touchId: -1,
  confidence: 0,
  type: 0,
  position: { x: 0, y: 0, z: 0, isFiltered: true, isValid: false },
  extremumDescription: {
    numFittingPoints: 0,
    percentageFittingPoints: 0,
    type: 0
  },
  time: 0
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

export const defaultFrame = [100, 100, 500, 500];

export const customFrame: FrameSizeDefinition = {
  width: 500,
  height: 400,
  left: 150,
  top: 75
};

export const defaultCalibrationMatrix: CalibrationTransform = {
  transformation: [
    [2.0, 0.0, 0.0, 50.0],
    [0.0, 3.0, 0.0, 60.0],
    [0.0, 0.0, 4.0, 70.0],
    [0.0, 0.0, 0.0, 1.0]
  ]
};

export const identityCalibrationMatrix: CalibrationTransform = {
  transformation: [
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0],
    [0.0, 0.0, 0.0, 1.0]
  ]
};

export const sourcePoints: Array<CalibrationPoint> = [
  { positionX: 150, positionY: 100, touchId: -1 },
  { positionX: 350, positionY: 100, touchId: -1 },
  { positionX: 150, positionY: 200, touchId: -1 }
];

export const targetPoints: Array<CalibrationPoint> = [
  { positionX: 150, positionY: 100, touchId: -1 },
  { positionX: 350, positionY: 100, touchId: -1 },
  { positionX: 150, positionY: 200, touchId: -1 }
];


