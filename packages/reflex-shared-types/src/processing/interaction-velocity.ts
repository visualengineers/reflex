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
  useKalmanFilter?: boolean;
  useVelocityPrediction?: boolean;
  kalmanPosition?: Point3 | null;
  /** Position covariance in sensor pixel² before calibration. */
  kalmanVarianceX?: number | null;
  kalmanVarianceY?: number | null;
  /** Calibrated 95% contour, generated for rendering without modifying raw covariance. */
  kalmanUncertainty?: Array<Point3>;
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
