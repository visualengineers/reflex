import {
  DEFAULT_SETTINGS,
  FrameSizeDefinition,
  Interaction,
  TuioPackageDetails
} from '@reflex/shared-types';
import { Subject, of } from 'rxjs';
import { queryElement } from '../../../../../test/helpers/dom';
import { CalibrationComponent } from './calibration/calibration.component';
import { NetworkComponent } from './network/network.component';
import { PackageDetailsComponent } from './network/tuio/package-details/package-details.component';
import { TuioComponent } from './network/tuio/tuio.component';
import { calibration, mount, network, processing, settings, setupTests, text, tuio } from './zoneless-change-detection.test-context';
import { frame, interaction, interactionData } from './zoneless-change-detection.test-data';

describe('TrackingServer zoneless DOM updates', () => {
  setupTests();

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

  it('renders network SignalR updates', async () => {
    settings.getSettings.mockReturnValue(of(structuredClone(DEFAULT_SETTINGS)));
    const response = new Subject<string>();
    network.getStatus.mockReturnValue(response);
    const fixture = await mount(NetworkComponent);
    response.next('Async network status');
    await fixture.whenStable();
    expect(text(fixture)).toContain('Async network status');
  });

  it('renders TUIO SignalR updates', async () => {
    const response = new Subject<string>();
    tuio.getStatus.mockReturnValue(response);
    const fixture = await mount(TuioComponent);
    response.next('Async TUIO status');
    await fixture.whenStable();
    expect(text(fixture)).toContain('Async TUIO status');
  });

  it('renders TUIO package payloads', async () => {
    const response = new Subject<TuioPackageDetails>();
    tuio.getPackages.mockReturnValue(response);
    const fixture = await mount(PackageDetailsComponent);
    response.next({
      sessionId: 42,
      frameId: 91,
      packageContent: 'Async TUIO package'
    });
    await fixture.whenStable();
    expect(text(fixture)).toContain('Async TUIO package');
    expect(text(fixture)).toContain('Frame Id: 91');
  });
});
