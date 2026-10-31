import { Subject } from 'rxjs';
import {
  measure,
  mount,
  setupTests as setupZonelessTests,
  text
} from '../../test-utils/zoneless-change-detection.test-context';
import { MeasureControlsComponent } from './measure-controls.component';

describe('Zoneless change detection: renders capture-state and sample-index polling independently', () => {
  setupZonelessTests();

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
});
