import { Point3 } from '../tracking/point3';

export interface InteractionVelocity {
  touchId: number;
  firstDerivation: Point3;
  secondDerivation: Point3;
  predictedPositionBasic: Point3;
  predictedPositionAdvanced: Point3;
}
