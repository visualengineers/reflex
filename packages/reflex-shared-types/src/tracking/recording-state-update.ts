import { RecordingState } from './recording-state';

export interface RecordingStateUpdate {
  state: RecordingState;
  framesRecorded: number;
  sessionName: string;
}
