import { Interaction } from './interaction';
import { InteractionVelocity } from './interaction-velocity';

export interface InteractionData {
  interaction: Interaction;
  velocity: InteractionVelocity;
}
