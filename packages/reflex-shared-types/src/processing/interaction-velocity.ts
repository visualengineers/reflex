import { Point3 } from '../tracking/point3';

/** Atomic snapshot in raw raster coordinates. Velocity is units/s; acceleration is units/s². Times are monotonic seconds. */
export interface InteractionVelocity {
  touchId: number;
  frameId: number;
  lastMeasuredFrameId: number;
  timestampSeconds: number;
  lastMeasuredTimestampSeconds: number;
  predictionTimestampSeconds: number;
  predictionHorizonSeconds: number;
  confidence: number;
  sampleCount: number;
  isPredicted: boolean;
  isPublished: boolean;
  suppressionReason: string;
  useSecondDerivation: boolean;
  width: number;
  height: number;
  measuredPosition: Point3;
  smoothedPosition: Point3;
  matchingPosition: Point3;
  firstDerivation: Point3;
  secondDerivation: Point3;
  predictedPositionBasic: Point3;
  predictedPositionAdvanced: Point3;
}
