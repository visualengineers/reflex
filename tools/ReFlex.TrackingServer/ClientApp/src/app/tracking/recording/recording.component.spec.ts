/* eslint-disable max-lines -- Keep all test scenarios for this component in one spec file. */
import { TestBed } from '@angular/core/testing';
import { RecordingState, RecordingStateUpdate } from '@reflex/shared-types';
import { Subject, of } from 'rxjs';
import { queryElement } from '../../../../../../../test/helpers/dom';
import {
  mount,
  recording,
  setupTests as setupZonelessTests,
  text
} from '../../test-utils/zoneless-change-detection.test-context';
import { streaming } from '../../test-utils/zoneless-change-detection.test-data';
import { RecordingComponent } from './recording.component';
import { component as testComponent, fixture as testFixture, setupTests } from './recording.component.test-context';
import {
  errorClear,
  errorDelete,
  errorRecordingState,
  errorRecordings,
  errorStart,
  errorStatus,
  errorStop,
  logService,
  recordingList,
  recordingService,
  recordingServiceError,
  recordingStateUpdates,
  testRecordingCam,
  testRecordingPath,
  testRecordingStateUpdate
} from './recording.component.test-data';

describe('Zoneless change detection: renders recording progress delivered after the start request', () => {
  setupZonelessTests();

  it('renders recording progress delivered after the start request', async () => {
    recording.getStatus.mockReturnValue(of(streaming));
    recording.startRecording.mockReturnValue(of('/recordings/test'));
    const response = new Subject<RecordingStateUpdate>();
    recording.getRecordingState.mockReturnValue(response);
    const fixture = await mount(RecordingComponent);

    queryElement((fixture.nativeElement as HTMLInputElement), '.icon-radio-checked')
      .click();
    await fixture.whenStable();
    response.next({
      state: RecordingState.Recording,
      framesRecorded: 42,
      sessionName: 'default'
    });
    await fixture.whenStable();
    expect(text(fixture)).toContain('Frames: 42');
    expect(queryElement((fixture.nativeElement as HTMLInputElement), '.icon-stop')).toBeTruthy();
    fixture.destroy();
    expect(response.observed).toBe(false);
  });
});

describe('Zoneless change detection: renders a recording-stream failure after the start request', () => {
  setupZonelessTests();

  it('renders a recording-stream failure after the start request', async () => {
    vi.spyOn(console, 'error').mockReturnValue(undefined);
    recording.getStatus.mockReturnValue(of(streaming));
    recording.startRecording.mockReturnValue(of('/recordings/test'));
    const response = new Subject<RecordingStateUpdate>();
    recording.getRecordingState.mockReturnValue(response);
    const fixture = await mount(RecordingComponent);

    queryElement((fixture.nativeElement as HTMLInputElement), '.icon-radio-checked')
      .click();
    await fixture.whenStable();
    response.error(new Error('Test recording stream failed'));
    await fixture.whenStable();
    expect(queryElement((fixture.nativeElement as HTMLInputElement), 'h3').textContent).toContain(
      'Faulted'
    );
    expect((fixture.nativeElement as HTMLInputElement).querySelector('.icon-stop')).toBeNull();
  });
});

describe('RecordingComponent', () => {
  setupTests();

  it('should create', () => {
    expect(testComponent).toBeTruthy();
  });

  it('should initialize Subscriptions correctly', async () => {
    await await testFixture.whenStable();

    expect(recordingService.getStatus).toHaveBeenCalledTimes(1);
    expect(testComponent.recordings).toEqual(recordingList);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(testComponent['trackingStateSubscription']).toBeDefined();
  });

  it('should correctly start recording', async () => {
    expect(testComponent.recordingEnabled).toBe(true);
    expect(testComponent.recordingName).not.toHaveLength(0);

    testComponent.startRecording();

    await testFixture.whenStable();

    expect(recordingService.startRecording).toHaveBeenCalledTimes(1);

    expect(recordingService.startRecording).toHaveBeenCalledWith(testComponent.recordingName, false);

    expect(recordingService.getRecordingState).toHaveBeenCalledTimes(1);

    expect(recordingService.getRecordings).toHaveBeenCalledTimes(2);

    expect(testComponent.recordingPath).toEqual(testRecordingPath);

    expect(testComponent.isRecording).toBe(true);

    expect(testComponent.recordingState).toEqual(testRecordingStateUpdate);
  });

  it('should correctly stop recording', async () => {
    expect(testComponent.recordingEnabled).toBe(true);
    expect(testComponent.recordingName).not.toHaveLength(0);

    testComponent.startRecording();

    await testFixture.whenStable();

    expect(testComponent.isRecording).toBe(true);

    expect(testComponent.recordingState.state).toEqual(RecordingState.Recording);

    testComponent.stopRecording();

    await testFixture.whenStable();

    expect(testComponent.isRecording).toBe(false);
    expect(testComponent.recordingState).toBeDefined();
    expect(testComponent.recordingState.state).toEqual(RecordingState.Stopped);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(recordingService.stopRecording).toHaveBeenCalledTimes(1);
  });

  it('should correctly delete recording', async () => {
    recordingService.getRecordings.mockClear();

    expect(testComponent.recordingEnabled).toBe(true);
    expect(testComponent.recordingName).not.toHaveLength(0);

    testComponent.deleteRecording(testRecordingCam);

    await testFixture.whenStable();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(recordingService.deleteRecording).toHaveBeenCalledTimes(1);

    expect(recordingService.deleteRecording).toHaveBeenCalledWith(
      testRecordingCam.name
    );
    expect(recordingService.getRecordings).toHaveBeenCalledTimes(1);
  });
});

describe('RecordingComponent', () => {
  setupTests();

  it('should not delete currently running recording', async () => {
    expect(testComponent.recordingEnabled).toBe(true);
    expect(testComponent.recordingName).not.toHaveLength(0);

    testComponent.startRecording();

    await testFixture.whenStable();

    recordingService.getRecordings.mockClear();

    expect(testComponent.isRecording).toBe(true);
    expect(testComponent.recordingState.sessionName).toEqual(testRecordingCam.name);

    testComponent.deleteRecording(testRecordingCam);

    expect(recordingService.deleteRecording).not.toHaveBeenCalled();
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(recordingService.getRecordings).not.toHaveBeenCalled();
  });

  it('should correctly clear recordings', async () => {
    recordingService.getRecordings.mockClear();

    expect(testComponent.recordingEnabled).toBe(true);
    expect(testComponent.recordingName).not.toHaveLength(0);

    expect(testComponent.isRecording).toBe(false);

    testComponent.clearRecordings();

    await await testFixture.whenStable();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(recordingService.clearRecordings).toHaveBeenCalledTimes(1);
    expect(recordingService.getRecordings).toHaveBeenCalledTimes(1);
  });

  it('should not clear recordings when currently recording', async () => {
    expect(testComponent.recordingEnabled).toBe(true);
    expect(testComponent.recordingName).not.toHaveLength(0);

    testComponent.startRecording();

    await testFixture.whenStable();

    recordingService.getRecordings.mockClear();

    expect(testComponent.isRecording).toBe(true);

    testComponent.clearRecordings();

    expect(recordingService.clearRecordings).not.toHaveBeenCalled();
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(recordingService.getRecordings).not.toHaveBeenCalled();
  });

  it('should unsubscribe completely onDestroy', async () => {
    await testFixture.whenStable();

    testComponent.ngOnDestroy();

    expect(testComponent['trackingStateSubscription']?.closed).toBeTruthy();
    expect(
      testComponent['recordingStateSubscription'] === undefined
        || testComponent['recordingStateSubscription'].closed
    ).toBe(true);
  });
});

describe('RecordingComponent', () => {
  setupTests();

  it('should enable recording when correct name is passed', () => {
    expect(typeof testComponent.recordingName).toBe('string');

    expect(testComponent.recordingEnabled).toBe(true);

    testComponent.recordingName = '';

    testComponent.recordingNameChanged();

    expect(testComponent.recordingEnabled).toBe(false);

    testComponent.recordingName = 'TEST2';

    testComponent.recordingNameChanged();

    expect(testComponent.recordingEnabled).toBe(true);

    testComponent.recordingName = '   ';

    testComponent.recordingNameChanged();

    expect(testComponent.recordingEnabled).toBe(false);
  });
});

describe('RecordingComponent: Error Handling', () => {
  setupTests('error');

  it('should handle errors correctly', async () => {
    await await testFixture.whenStable();

    expect(testComponent).toBeTruthy();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(3);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorRecordings);
  });

  it('should start recording only when enabled and correct name given', async () => {
    await testFixture.whenStable();

    expect(testComponent.recordingEnabled).toBe(false);

    testComponent.startRecording();

    await testFixture.whenStable();

    expect(recordingServiceError.startRecording).not.toHaveBeenCalled();
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(4);

    testComponent.recordingEnabled = true;
    testComponent.recordingName = '';

    testComponent.startRecording();

    await testFixture.whenStable();

    expect(recordingServiceError.startRecording).not.toHaveBeenCalled();
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(5);

    testComponent.recordingName = 'Test';

    testComponent.startRecording();

    await testFixture.whenStable();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(6);
    expect(recordingServiceError.startRecording).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStart);

    expect(recordingServiceError.getRecordingState).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorRecordingState);

    expect(testComponent.isRecording).toBe(false);

    expect(testComponent.recordingState).toBeDefined();
    expect(testComponent.recordingState.state).toEqual(RecordingState.Faulted);

    testComponent.stopRecording();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(7);
    expect(recordingServiceError.stopRecording).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStop);

    testComponent.deleteRecording(testRecordingCam);

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(8);
    expect(recordingServiceError.deleteRecording).toHaveBeenCalledTimes(1);
    expect(recordingServiceError.deleteRecording).toHaveBeenCalledWith(
      testRecordingCam.name
    );
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorDelete);

    testComponent.clearRecordings();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(9);
    expect(recordingServiceError.clearRecordings).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorClear);
  });
});

describe('RecordingComponent: view navigation', () => {
  setupTests();

  it('should restore a running recording after the view is recreated', () => {
    testComponent.startRecording();
    testFixture.destroy();
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
    testComponent.startRecording();
    testComponent.stopRecording();
    recordingStateUpdates.next(testRecordingStateUpdate);
    expect(testComponent.isRecording).toBe(true);
  });

});

describe('RecordingComponent: storage format', () => {
  setupTests();

  it('should default to JPG', () => {
    expect(testComponent.usePng).toBe(false);
    testComponent.startRecording();
    expect(recordingService.startRecording).toHaveBeenCalledWith(testComponent.recordingName, false);
  });

  it.each([true, false])('should preserve usePng=%s when the view is recreated', async (usePng) => {
    testComponent.usePng = !usePng;
    testComponent.usePng = usePng;
    testFixture.destroy();

    const restoredFixture = TestBed.createComponent(RecordingComponent);
    const restored = restoredFixture.componentInstance;
    restoredFixture.detectChanges();
    await restoredFixture.whenStable();

    const element = restoredFixture.nativeElement as HTMLElement;
    const select = element.querySelector<HTMLSelectElement>('#recording-format-select');

    expect(restored.usePng).toBe(usePng);
    expect(select?.selectedIndex).toBe(usePng ? 1 : 0);
    restored.startRecording();
    expect(recordingService.startRecording).toHaveBeenCalledWith(restored.recordingName, usePng);
    restoredFixture.destroy();
  });

  it('should pass the selected PNG option and lock the selection during recording', async () => {
    const element = testFixture.nativeElement as HTMLElement;
    const select = element.querySelector<HTMLSelectElement>('#recording-format-select');

    expect(select).not.toBeNull();
    if (!select) {
      throw new Error('Missing storage format selection');
    }

    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));
    await testFixture.whenStable();

    expect(testComponent.usePng).toBe(true);
    testComponent.startRecording();
    testFixture.detectChanges();
    await testFixture.whenStable();

    expect(recordingService.startRecording).toHaveBeenCalledWith(testComponent.recordingName, true);
    expect(select.disabled).toBe(true);

    testComponent.stopRecording();
    testFixture.detectChanges();
    await testFixture.whenStable();
    expect(select.disabled).toBe(false);
  });
});
