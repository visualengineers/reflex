import { Point3 } from '../tracking/point3';

/** Atomic snapshot in raw raster coordinates. Derivatives are per processed frame. */
export interface InteractionVelocity {
  touchId: number;
  frameId: number;
  lastMeasuredFrameId: number;
  predictionFrameId: number;
  sampleCount: number;
  isPredicted: boolean;
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
