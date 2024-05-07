import { Interaction } from '@reflex/shared-types';

export interface TouchPointState {
  points: Interaction[];
  frameNumber: number;
  webSocketAddress: string;
  isConnected: boolean;
}
