import { Interaction } from './interaction';

export interface InteractionFrame {
  frameId: number;
  interactions: Array<Interaction>;
}
