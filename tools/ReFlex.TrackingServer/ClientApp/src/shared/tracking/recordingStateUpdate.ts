import { RecordingState } from './recordingState';
export interface RecordingStateUpdate {
  state: RecordingState;
  framesRecorded: number;
  sessionName: string;
}
