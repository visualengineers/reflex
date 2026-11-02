import { TestBed } from '@angular/core/testing';
import { RecordingComponent } from './recording.component';
import { component, fixture, setupTests } from './recording.component.1.test-context';
import { recordingService, recordingStateUpdates, testRecordingCam, testRecordingStateUpdate } from './recording.component.test-data';

describe('RecordingComponent: view navigation', () => {
  setupTests();

  it('should restore a running recording after the view is recreated', () => {
    component.startRecording();
    fixture.destroy();
    const restoredFixture = TestBed.createComponent(RecordingComponent);
    const restored = restoredFixture.componentInstance;
    restoredFixture.detectChanges();

    expect(restored.isRecording).toBe(true);
    expect(restored.recordingState).toEqual(testRecordingStateUpdate);
    expect(recordingService.startRecording).toHaveBeenCalledTimes(1);

    recordingStateUpdates.next({ ...testRecordingStateUpdate, framesRecorded: 42 });
    expect(restored.recordingState.framesRecorded).toBe(42);
    restored.deleteRecording(testRecordingCam);
    expect(recordingService.deleteRecording).not.toHaveBeenCalled();
    restoredFixture.destroy();
  });

  it('should keep observing state after stopping a recording', () => {
    component.startRecording();
    component.stopRecording();
    recordingStateUpdates.next(testRecordingStateUpdate);
    expect(component.isRecording).toBe(true);
  });

});
