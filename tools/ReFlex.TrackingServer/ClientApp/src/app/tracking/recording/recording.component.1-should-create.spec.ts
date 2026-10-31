import {
  RecordingState
} from '@reflex/shared-types';
import { component, fixture, setupTests } from './recording.component.1.test-context';
import { logService, recordingList, recordingService, testRecordingCam, testRecordingPath, testRecordingStateUpdate } from './recording.component.test-data';

describe('RecordingComponent', () => {
  setupTests();

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize Subscriptions correctly', async () => {
    await await fixture.whenStable();

    expect(recordingService.getStatus).toHaveBeenCalledTimes(1);
    expect(component.recordings).toEqual(recordingList);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(component['trackingStateSubscription']).toBeDefined();
  });

  it('should correctly start recording', async () => {
    expect(component.recordingEnabled).toBe(true);
    expect(component.recordingName).not.toHaveLength(0);

    component.startRecording();

    await fixture.whenStable();

    expect(recordingService.startRecording).toHaveBeenCalledTimes(1);

    expect(recordingService.startRecording).toHaveBeenCalledWith(
      component.recordingName
    );

    expect(recordingService.getRecordingState).toHaveBeenCalledTimes(1);

    expect(recordingService.getRecordings).toHaveBeenCalledTimes(2);

    expect(component.recordingPath).toEqual(testRecordingPath);

    expect(component.isRecording).toBe(true);

    expect(component.recordingState).toEqual(testRecordingStateUpdate);
  });

  it('should correctly stop recording', async () => {
    expect(component.recordingEnabled).toBe(true);
    expect(component.recordingName).not.toHaveLength(0);

    component.startRecording();

    await fixture.whenStable();

    expect(component.isRecording).toBe(true);

    expect(component.recordingState.state).toEqual(RecordingState.Recording);

    component.stopRecording();

    await fixture.whenStable();

    expect(component.isRecording).toBe(false);
    expect(component.recordingState).toBeDefined();
    expect(component.recordingState.state).toEqual(RecordingState.Stopped);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(recordingService.stopRecording).toHaveBeenCalledTimes(1);
  });

  it('should correctly delete recording', async () => {
    recordingService.getRecordings.mockClear();

    expect(component.recordingEnabled).toBe(true);
    expect(component.recordingName).not.toHaveLength(0);

    component.deleteRecording(testRecordingCam);

    await fixture.whenStable();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(recordingService.deleteRecording).toHaveBeenCalledTimes(1);

    expect(recordingService.deleteRecording).toHaveBeenCalledWith(
      testRecordingCam.name
    );
    expect(recordingService.getRecordings).toHaveBeenCalledTimes(1);
  });
});
