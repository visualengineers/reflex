import { InteractionFrame, InteractionHistory } from '@reflex/shared-types';
import { Subject, of } from 'rxjs';
import {
  mount,
  processing,
  setupTests as setupZonelessTests,
  text
} from '../../test-utils/zoneless-change-detection.test-context';
import { interaction } from '../../test-utils/zoneless-change-detection.test-data';
import { HistoryComponent } from './history.component';

describe('Zoneless change detection: renders frame/history stream updates', () => {
  setupZonelessTests();

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
});
