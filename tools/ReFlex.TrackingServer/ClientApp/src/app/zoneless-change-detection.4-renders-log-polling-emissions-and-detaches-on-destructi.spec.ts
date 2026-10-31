import {
  FrameSizeDefinition,
  LogLevel,
  LogMessageDetail,
  RecordingState,
  RecordingStateUpdate
} from '@reflex/shared-types';
import { Subject, of } from 'rxjs';
import { queryElement } from '../../../../../test/helpers/dom';
import { LogComponent } from './log/log.component';
import { MeasureControlsComponent } from './measure-surface/measure-controls/measure-controls.component';
import { MeasureSurfaceComponent } from './measure-surface/measure-surface.component';
import { RecordingComponent } from './tracking/recording/recording.component';
import { calibration, log, measure, mount, recording, setupTests, text } from './zoneless-change-detection.test-context';
import { frame, streaming } from './zoneless-change-detection.test-data';

describe('TrackingServer zoneless DOM updates', () => {
  setupTests();

  it('renders log polling emissions and detaches on destruction', async () => {
    const response = new Subject<LogMessageDetail>();
    log.getLogs.mockReturnValue(response);
    const fixture = await mount(LogComponent);
    response.next({
      id: 42,
      formattedMessage: 'Async log message',
      level: LogLevel.Info
    });
    await fixture.whenStable();
    expect(text(fixture)).toContain('Async log message');
    fixture.destroy();
    expect(response.observed).toBe(false);
  });

  it('renders capture-state and sample-index polling independently', async () => {
    const capturing = new Subject<boolean>();
    const index = new Subject<number>();
    measure.isCapturing.mockReturnValue(capturing);
    measure.getCurrentSampleIdx.mockReturnValue(index);
    const fixture = await mount(MeasureControlsComponent);
    await new Promise((resolve) => setTimeout(resolve, 0));
    capturing.next(true);
    await fixture.whenStable();
    expect(text(fixture)).toContain('Captured Frame');
    index.next(7);
    await fixture.whenStable();
    expect(text(fixture)).toContain('7 / 10');
  });

  it('updates the measurement viewport after frame-size responses', async () => {
    const response = new Subject<FrameSizeDefinition>();
    calibration.getFrameSize.mockReturnValue(response);
    const fixture = await mount(MeasureSurfaceComponent);

    queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#visualization-toggle')
      .click();
    await fixture.whenStable();
    response.next(frame);
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '.measure__visualization').style.width
    ).toBe('640px');
  });

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
