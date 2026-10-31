import {
  CameraConfiguration,
  DepthCameraState,
  RecordingState,
  RecordingStateUpdate
} from '@reflex/shared-types';
import { of, throwError } from 'rxjs';

export const recordingService = {
  getStatus: vi.fn().mockName('fakeRecordingService.getStatus'),
  getRecordings: vi.fn().mockName('fakeRecordingService.getRecordings'),
  getRecordingState: vi.fn().mockName('fakeRecordingService.getRecordingState'),
  startRecording: vi.fn().mockName('fakeRecordingService.startRecording'),
  stopRecording: vi.fn().mockName('fakeRecordingService.stopRecording'),
  deleteRecording: vi.fn().mockName('fakeRecordingService.deleteRecording'),
  clearRecordings: vi.fn().mockName('fakeRecordingService.clearRecordings')
};

export const recordingServiceError = {
  getStatus: vi.fn().mockName('fakeRecordingService.getStatus'),
  getRecordings: vi.fn().mockName('fakeRecordingService.getRecordings'),
  getRecordingState: vi.fn().mockName('fakeRecordingService.getRecordingState'),
  startRecording: vi.fn().mockName('fakeRecordingService.startRecording'),
  stopRecording: vi.fn().mockName('fakeRecordingService.stopRecording'),
  deleteRecording: vi.fn().mockName('fakeRecordingService.deleteRecording'),
  clearRecordings: vi.fn().mockName('fakeRecordingService.clearRecordings')
};

export const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog')
};

export const testRecordingCam: CameraConfiguration = {
  name: 'RecordedTest',
  framerate: 30,
  width: 640,
  height: 480
};

recordingService.getStatus.mockReturnValue(
  of({
    isCameraSelected: true,
    depthCameraStateName: DepthCameraState[DepthCameraState.Streaming],
    selectedCameraName: 'TestCamera',
    selectedConfigurationName: 'TestConfig'
  })
);

export const testRecordingPath = 'Path/to/TestRecording.xyz';

recordingService.startRecording.mockReturnValue(of(testRecordingPath));

export const testRecordingStateUpdate: RecordingStateUpdate = {
  state: RecordingState.Recording,
  framesRecorded: 1,
  sessionName: testRecordingCam.name
};

recordingService.stopRecording.mockReturnValue(of(testRecordingCam));

recordingService.getRecordingState.mockReturnValue(
  of(testRecordingStateUpdate)
);

export const recordingList: Array<CameraConfiguration> = [
  {
    name: 'TestCam',
    framerate: 30,
    width: 100,
    height: 50
  },
  {
    name: 'TestCam 2',
    framerate: 45,
    width: 320,
    height: 240
  }
];

recordingService.getRecordings.mockReturnValue(of(recordingList));

recordingService.deleteRecording.mockReturnValue(
  of('Successfully deleted recording')
);

recordingService.clearRecordings.mockReturnValue(
  of('Successfully deleted all recordings')
);

export const errorStatus = 'TestError: getStatus()';

recordingServiceError.getStatus.mockReturnValue(throwError(errorStatus));

export const errorRecordings = 'TestError: getRecordings()';

recordingServiceError.getRecordings.mockReturnValue(
  throwError(errorRecordings)
);

export const errorRecordingState = 'TestError: getRecordingState()';

recordingServiceError.getRecordingState.mockReturnValue(
  throwError(errorRecordingState)
);

export const errorStart = 'TestError: startRecording()';

recordingServiceError.startRecording.mockReturnValue(throwError(errorStart));

export const errorStop = 'TestError: stopRecording()';

recordingServiceError.stopRecording.mockReturnValue(throwError(errorStop));

export const errorDelete = 'TestError: deleteRecording()';

recordingServiceError.deleteRecording.mockReturnValue(throwError(errorDelete));

export const errorClear = 'TestError: clearRecordings()';

recordingServiceError.clearRecordings.mockReturnValue(throwError(errorClear));
