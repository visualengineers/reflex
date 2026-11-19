import { Point3 } from '../tracking/point3';
import { ExtremumDescription } from './extremum-description';
import { InteractionType } from './interaction-type';
import { InteractionTrackingState } from './interaction-tracking-state';

export interface Interaction {
  touchId: number;
  /** Absent on older servers: treat undefined as unknown, without inferring a lifecycle state. */
  trackingState?: InteractionTrackingState;
  position: Point3;
  type: InteractionType;
  extremumDescription: ExtremumDescription;
  confidence: number;
  time: number;
}
