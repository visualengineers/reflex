import {
  InteractionFrame,
  InteractionHistory,
  RecordingStateUpdate
} from '@reflex/shared-types';
import { Subject, of } from 'rxjs';
import { queryElement } from '../../../../../test/helpers/dom';
import { HistoryVisualizationComponent } from './processing/history-visualization/history-visualization.component';
import { HistoryComponent } from './processing/history/history.component';
import { InteractionsVisualizationComponent } from './processing/interactions-visualization/interactions-visualization.component';
import { InteractionsComponent } from './processing/interactions/interactions.component';
import { RecordingComponent } from './tracking/recording/recording.component';
import { mount, processing, recording, setupTests, text } from './zoneless-change-detection.test-context';
import { interaction, interactionData, streaming } from './zoneless-change-detection.test-data';

describe('TrackingServer zoneless DOM updates', () => {
  setupTests();

  it('renders frame/history stream updates', async () => {
    processing.getStatus.mockReturnValue(of('Active'));
    const frames = new Subject<Array<InteractionFrame>>();
    const history = new Subject<Array<InteractionHistory>>();
    processing.getFrames.mockReturnValue(frames);
    processing.getHistory.mockReturnValue(history);
    const fixture = await mount(HistoryComponent);
    frames.next([{ frameId: 8123, interactions: [structuredClone(interaction)] }]);
    history.next([
      {
        touchId: 42,
        items: [{ frameId: 9991, interaction: structuredClone(interaction) }]
      }
    ]);
    await fixture.whenStable();
    expect(text(fixture)).toContain('8123');
    expect(text(fixture)).toContain('9991');
  });

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

  it('renders history stream emissions in SVG', async () => {
    processing.getStatus.mockReturnValue(of('Active'));
    const response = new Subject<Array<InteractionHistory>>();
    processing.getHistory.mockReturnValue(response);
    const fixture = await mount(HistoryVisualizationComponent);
    response.next([
      {
        touchId: 42,
        items: [{ frameId: 1, interaction: structuredClone(interaction) }]
      }
    ]);
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLInputElement).querySelectorAll('circle.history__point').length
    ).toBe(1);
  });

  it('renders imperative ViewChild interaction-table updates', async () => {
    const fixture = await mount(InteractionsComponent);
    fixture.componentInstance.updateInteractions(interactionData());
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLInputElement).querySelectorAll('tbody tr').length).toBe(3);
    expect(text(fixture)).toContain('42');
  });

  it('renders imperative ViewChild interaction-visualization updates', async () => {
    const fixture = await mount(InteractionsVisualizationComponent);
    fixture.componentInstance.updateCalibratedInteractions(interactionData());
    await fixture.whenStable();
    expect(text(fixture)).toContain('Count: 1');
    expect(
      (fixture.nativeElement as HTMLInputElement).querySelectorAll('.interactions__point').length
    ).toBe(1);
  });
});
