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
