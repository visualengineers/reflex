import { FrameSizeDefinition, Interaction } from '@reflex/shared-types';
import { Subject, of } from 'rxjs';
import { queryElement } from '../../../../../../test/helpers/dom';
import {
  calibration,
  mount,
  setupTests as setupZonelessTests,
  processing,
  text
} from '../test-utils/zoneless-change-detection.test-context';
import { frame, interaction, interactionData } from '../test-utils/zoneless-change-detection.test-data';
import { CalibrationComponent } from './calibration.component';

describe('Zoneless change detection: renders asynchronous calibration borders', () => {
  setupZonelessTests();

  it('renders asynchronous calibration borders', async () => {
    const response = new Subject<FrameSizeDefinition>();
    calibration.getFrameSize.mockReturnValue(response);
    const fixture = await mount(CalibrationComponent);
    response.next(frame);
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '#calibration-border-top').style
        .transform
    ).toBe('translateY(17px)');
  });
});

describe('Zoneless change detection: updates calibration enablement before the interaction stream emits', () => {
  setupZonelessTests();

  it('updates calibration enablement before the interaction stream emits', async () => {
    const response = new Subject<string>();
    processing.getStatus.mockReturnValue(response);
    const fixture = await mount(CalibrationComponent);
    response.next('Active');
    await fixture.whenStable();
    expect(
      queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#calibrations-interactions-toggle')
        .disabled
    ).toBe(false);
    response.next('Inactive');
    await fixture.whenStable();
    expect(
      queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#calibrations-interactions-toggle')
        .disabled
    ).toBe(true);
  });
});

describe('Zoneless change detection: renders calibrated interaction results after a live interaction arrives', () => {
  setupZonelessTests();

  it('renders calibrated interaction results after a live interaction arrives', async () => {
    processing.getStatus.mockReturnValue(of('Active'));
    const response = new Subject<Array<Interaction>>();
    processing.getInteractions.mockReturnValue(response);
    calibration.computeCalibratedAbsolutePosition.mockImplementation(() =>
      of(interactionData()));
    const fixture = await mount(CalibrationComponent);

    queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#calibrations-interactions-toggle')
      .click();
    await fixture.whenStable();
    response.next([structuredClone(interaction)]);
    await fixture.whenStable();
    expect(
      queryElement<HTMLSelectElement>((fixture.nativeElement as HTMLInputElement), 'input[title="select point"]')
    ).toBeTruthy();
    expect(text(fixture)).toContain('42');
  });
});
