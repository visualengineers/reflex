import { Point3 } from '../tracking/point3';
import { ExtremumDescription as ExtremumDescription } from './extremum-description';
import { InteractionType } from './interaction-type';

export interface Interaction {
  touchId: number;
  position: Point3;
  type: InteractionType;
  extremumDescription: ExtremumDescription;
  confidence: number;
  time: number;
}
