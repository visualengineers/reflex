import {
  RecordingState
} from '@reflex/shared-types';
import { component, fixture, setupTests } from './recording.component.2.test-context';
import { errorClear, errorDelete, errorRecordings, errorRecordingState, errorStart, errorStatus, errorStop, logService, recordingServiceError, testRecordingCam } from './recording.component.test-data';

describe('RecordingComponent: Error Handling', () => {
  setupTests();

  it('should handle errors correctly', async () => {
    await await fixture.whenStable();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(2);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorRecordings);
  });

  it('should start recording only when enabled and correct name given', async () => {
    await fixture.whenStable();

    expect(component.recordingEnabled).toBe(false);

    component.startRecording();

    await fixture.whenStable();

    expect(recordingServiceError.startRecording).not.toHaveBeenCalled();
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(3);

    component.recordingEnabled = true;
    component.recordingName = '';

    component.startRecording();

    await fixture.whenStable();

    expect(recordingServiceError.startRecording).not.toHaveBeenCalled();
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(4);

    component.recordingName = 'Test';

    component.startRecording();

    await fixture.whenStable();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(6);
    expect(recordingServiceError.startRecording).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStart);

    expect(recordingServiceError.getRecordingState).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorRecordingState);

    expect(component.isRecording).toBe(false);

    expect(component.recordingState).toBeDefined();
    expect(component.recordingState.state).toEqual(RecordingState.Faulted);

    component.stopRecording();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(7);
    expect(recordingServiceError.stopRecording).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStop);

    component.deleteRecording(testRecordingCam);

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(8);
    expect(recordingServiceError.deleteRecording).toHaveBeenCalledTimes(1);
    expect(recordingServiceError.deleteRecording).toHaveBeenCalledWith(
      testRecordingCam.name
    );
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorDelete);

    component.clearRecordings();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(9);
    expect(recordingServiceError.clearRecordings).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorClear);
  });
});
