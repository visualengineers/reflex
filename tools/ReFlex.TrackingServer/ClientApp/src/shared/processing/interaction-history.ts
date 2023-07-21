import { InteractionHistoryElement } from './interaction-history-element';

export interface InteractionHistory {
  touchId: number;

  items: Array<InteractionHistoryElement>;
}
