import { FrameSizeDefinition } from '@reflex/shared-types';
import { Subject } from 'rxjs';
import { queryElement } from '../../../../../../test/helpers/dom';
import {
  calibration,
  mount,
  setupTests as setupZonelessTests
} from '../test-utils/zoneless-change-detection.test-context';
import { frame } from '../test-utils/zoneless-change-detection.test-data';
import { MeasureSurfaceComponent } from './measure-surface.component';

describe('Zoneless change detection: updates the measurement viewport after frame-size responses', () => {
  setupZonelessTests();

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
});
