import { InteractionVelocity, Point3 } from '@reflex/shared-types';

const point = (x: number, y = 40): Point3 => ({ x, y, z: -0.5, isValid: true, isFiltered: false });
export const predictionSnapshot = (frame = 3): InteractionVelocity => ({
  touchId: 42,
  frameId: frame,
  lastMeasuredFrameId: frame,
  timestampSeconds: frame / 10,
  lastMeasuredTimestampSeconds: frame / 10,
  predictionTimestampSeconds: (frame / 10) + 0.05,
  predictionHorizonSeconds: 0.05,
  confidence: 7.5,
  sampleCount: 3,
  isPredicted: false,
  isPublished: true,
  suppressionReason: '',
  useSecondDerivation: true,
  width: 320,
  height: 240,
  measuredPosition: point(100),
  smoothedPosition: point(95),
  matchingPosition: point(98),
  firstDerivation: point(5, 0),
  secondDerivation: point(2, 0),
  predictedPositionBasic: point(105),
  predictedPositionAdvanced: point(106)
});

