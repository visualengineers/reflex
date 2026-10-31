import { FrameSizeDefinition } from '@reflex/shared-types';
import { Subject } from 'rxjs';
import { queryElement } from '../../../../../../../test/helpers/dom';
import {
  mount,
  setupTests as setupZonelessTests,
  text,
  calibration
} from '../../test-utils/zoneless-change-detection.test-context';
import { interactionData, frame } from '../../test-utils/zoneless-change-detection.test-data';
import { InteractionsVisualizationComponent } from './interactions-visualization.component';

describe('Zoneless change detection: renders imperative ViewChild interaction-visualization updates', () => {
  setupZonelessTests();

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

describe('Zoneless change detection: updates visualization frame geometry after HTTP responses', () => {
  setupZonelessTests();

  it('updates visualization frame geometry after HTTP responses', async () => {
    const response = new Subject<FrameSizeDefinition>();
    calibration.getFrameSize.mockReturnValue(response);
    const fixture = await mount(InteractionsVisualizationComponent);

    queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#visualization-toggle')
      .click();
    await fixture.whenStable();
    response.next(frame);
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '.interactions__visualization').style
        .width
    ).toBe('640px');
  });
});
