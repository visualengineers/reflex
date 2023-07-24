import { Interaction } from './interaction';

export interface CompleteInteractionData {
  raw: Array<Interaction>;
  normalized: Array<Interaction>;
  absolute: Array<Interaction>;

}
