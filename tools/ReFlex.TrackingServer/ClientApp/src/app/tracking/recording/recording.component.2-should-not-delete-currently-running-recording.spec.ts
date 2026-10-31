import { component, fixture, setupTests } from './recording.component.1.test-context';
import { logService, recordingService, testRecordingCam } from './recording.component.test-data';

describe('RecordingComponent', () => {
  setupTests();

  it('should not delete currently running recording', async () => {
    expect(component.recordingEnabled).toBe(true);
    expect(component.recordingName).not.toHaveLength(0);

    component.startRecording();

    await fixture.whenStable();

    recordingService.getRecordings.mockClear();

    expect(component.isRecording).toBe(true);
    expect(component.recordingState.sessionName).toEqual(testRecordingCam.name);

    component.deleteRecording(testRecordingCam);

    expect(recordingService.deleteRecording).not.toHaveBeenCalled();
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(recordingService.getRecordings).not.toHaveBeenCalled();
  });

  it('should correctly clear recordings', async () => {
    recordingService.getRecordings.mockClear();

    expect(component.recordingEnabled).toBe(true);
    expect(component.recordingName).not.toHaveLength(0);

    expect(component.isRecording).toBe(false);

    component.clearRecordings();

    await await fixture.whenStable();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(recordingService.clearRecordings).toHaveBeenCalledTimes(1);
    expect(recordingService.getRecordings).toHaveBeenCalledTimes(1);
  });

  it('should not clear recordings when currently recording', async () => {
    expect(component.recordingEnabled).toBe(true);
    expect(component.recordingName).not.toHaveLength(0);

    component.startRecording();

    await fixture.whenStable();

    recordingService.getRecordings.mockClear();

    expect(component.isRecording).toBe(true);

    component.clearRecordings();

    expect(recordingService.clearRecordings).not.toHaveBeenCalled();
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(recordingService.getRecordings).not.toHaveBeenCalled();
  });

  it('should unsubscribe completely onDestroy', async () => {
    await fixture.whenStable();

    component.ngOnDestroy();

    expect(component['trackingStateSubscription']?.closed).toBeTruthy();
    expect(
      component['recordingStateSubscription'] === undefined
        || component['recordingStateSubscription'].closed
    ).toBe(true);
  });
});
