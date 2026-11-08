import { Interaction } from './interaction';

export interface InteractionFrame {
  timestampSeconds?: number;
  frameId: number;
  interactions: Array<Interaction>;
}
