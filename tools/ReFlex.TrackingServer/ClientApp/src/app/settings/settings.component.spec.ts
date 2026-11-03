import { DEFAULT_SETTINGS, PerformanceData, TrackingServerAppSettings } from '@reflex/shared-types';
import { Subject, of } from 'rxjs';
import { queryElement } from '../../../../../../test/helpers/dom';
import {
  mount,
  performance,
  settings,
  setupTests as setupZonelessTests,
  text,
  tracking
} from '../test-utils/zoneless-change-detection.test-context';
import { streaming } from '../test-utils/zoneless-change-detection.test-data';
import { SettingsComponent } from './settings.component';
import { component as testComponent, fixture as testFixture, setupTests } from './settings.component.test-context';
import { logService, performanceService } from './settings.component.test-data';

describe('Zoneless change detection: updates nested settings and form controls after a settings response', () => {
  setupZonelessTests();

  it('updates nested settings and form controls after a settings response', async () => {
    const response = new Subject<TrackingServerAppSettings>();
    settings.getSettings.mockReturnValue(response);
    const fixture = await mount(SettingsComponent);
    const value = structuredClone(DEFAULT_SETTINGS);
    value.filterSettingValues.borderValue.left = 12;
    response.next(value);
    await fixture.whenStable();
    const input: HTMLInputElement = queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), 'app-value-slider[elementid="settings-leftBorder"] input.custom-input');
    expect(input.value).toBe('12');
  });
});

describe('Zoneless change detection: renders performance stream updates in the filter table', () => {
  setupZonelessTests();

  it('renders performance stream updates in the filter table', async () => {
    const value = structuredClone(DEFAULT_SETTINGS);
    value.filterSettingValues.measurePerformance = true;
    settings.getSettings.mockReturnValue(of(value));
    const response = new Subject<PerformanceData>();
    performance.getData.mockReturnValue(response);
    const fixture = await mount(SettingsComponent);
    response.next({
      data: [
        {
          frameId: 8123,
          frameStart: 1,
          frameEnd: 2,
          totalFrameTime: 1,
          boxFilter: 1
        }
      ]
    });
    await fixture.whenStable();
    expect(text(fixture)).toContain('8123');
  });
});

describe('Zoneless change detection: renders limitation-filter polling responses', () => {
  setupZonelessTests();

  it('renders limitation-filter polling responses', async () => {
    const value = structuredClone(DEFAULT_SETTINGS);
    value.filterSettingValues.limitationFilterType = 1;
    settings.getSettings.mockReturnValue(of(value));
    tracking.getStatus.mockReturnValue(of(streaming));
    const response = new Subject<{
      name: string;
      value: boolean;
    }>();
    let pollStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      pollStarted = resolve;
    });
    settings.isLimitationFilterInitializing.mockImplementation(() => {
      pollStarted();

      return response;
    });
    settings.isLimitationFilterInitialized.mockReturnValue(
      of({ name: 'initialized', value: false })
    );
    const fixture = await mount(SettingsComponent);
    const button = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((node) => node.textContent?.includes('Initialize Filter'));
    if (button === undefined) {
      throw new Error('Initialize Filter button is missing');
    }
    expect(button.classList).not.toContain('button-disabled');
    await started;
    response.next({ name: 'initializing', value: true });
    await fixture.whenStable();
    expect(button.classList).toContain('button-disabled');
  });
});


describe('Contact retention settings', () => {
  setupZonelessTests();

  it('displays fractional seconds independently of history capacity and saves the duration', async () => {
    const value = structuredClone(DEFAULT_SETTINGS);
    value.filterSettingValues.smoothingValues.contactRetentionSeconds = 0.25;
    value.filterSettingValues.smoothingValues.interactionHistorySize = 1;
    settings.getSettings.mockReturnValue(of(value));
    settings.setSmoothingValues.mockReturnValue(of(value.filterSettingValues.smoothingValues));
    const fixture = await mount(SettingsComponent);
    const control = queryElement(
      fixture.nativeElement as HTMLElement,
      'app-value-slider[elementid="settings-contactRetention"]'
    );
    const input = queryElement<HTMLInputElement>(control, 'input.custom-input');
    expect(input.value).toBe('0.25');
    expect(control.textContent).toContain('Contact retention');
    expect(control.textContent).toContain('independent');
    input.value = '0.35';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.componentInstance.saveSmoothingValues();
    expect(settings.setSmoothingValues.mock.calls.at(-1)?.[0]).toEqual(expect.objectContaining({ contactRetentionSeconds: 0.35 }));
  });
  it('saves confidence rates in units per second', async () => {
    const value = structuredClone(DEFAULT_SETTINGS);
    settings.getSettings.mockReturnValue(of(value));
    settings.setSmoothingValues.mockReturnValue(of(value.filterSettingValues.smoothingValues));
    const fixture = await mount(SettingsComponent);
    for (const [id, rate] of [['confidenceGain', '12'], ['confidenceDecay', '18']]) {
      const input = queryElement<HTMLInputElement>(
        fixture.nativeElement as HTMLElement,
        `app-value-slider[elementid="settings-${id}"] input.custom-input`
      );
      input.value = rate;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('change'));
    }
    await fixture.whenStable();
    fixture.componentInstance.saveSmoothingValues();
    expect(settings.setSmoothingValues.mock.calls.at(-1)?.[0]).toEqual(expect.objectContaining({
      confidenceGainPerSecond: 12, confidenceDecayPerSecond: 18
    }));
  });

});

describe('Extremum consolidation settings', () => {
  setupZonelessTests();

  it.each([undefined, 0, 5])('loads a legacy or explicit merge radius: %s', async (radius) => {
    const value = structuredClone(DEFAULT_SETTINGS);
    value.filterSettingValues.extremumSettings.mergeRadius = radius;
    settings.getSettings.mockReturnValue(of(value));
    settings.setExtremumSettings.mockReturnValue(of(value.filterSettingValues.extremumSettings));
    const fixture = await mount(SettingsComponent);
    const input = queryElement<HTMLInputElement>(
      fixture.nativeElement as HTMLElement,
      'app-value-slider[elementid="settings-extremum-mergeRadius"] input.custom-input'
    );
    expect(input.value).toBe(String(radius ?? 3));
    input.value = '4';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.componentInstance.saveExtremumValues();
    expect(settings.setExtremumSettings.mock.calls.at(-1)?.[0]).toEqual(expect.objectContaining({ mergeRadius: 4 }));
  });
});

describe('SettingsComponent', () => {
  setupTests();

  it('should create', () => {
    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('combines partial performance frames and updates existing chart entries', async () => {
    const updates = new Subject<PerformanceData>();
    performanceService.getData.mockReturnValue(updates);
    await testFixture.whenStable();
    updates.next({
      data: [
        {
          frameId: 1,
          frameStart: 1000,
          frameEnd: 5000,
          totalFrameTime: 0,
          boxFilter: 2,
          valueFilter: 3
        }
      ]
    });
    await testFixture.whenStable();
    expect(testComponent.performanceDataFilterVis[0].totalFilter).toBe(5);

    updates.next({
      data: [
        {
          frameId: 1,
          frameStart: 2000,
          frameEnd: 6000,
          totalFrameTime: 0,
          processingPreparation: 4,
          processingConvert: 5
        }
      ]
    });
    await testFixture.whenStable();
    expect(testComponent.performanceDataProcessingVis[0].totalProcessing).toBe(9);
    expect(
      testComponent.performanceDataCompleteTimeFrameVis[0].totalFrameTime
    ).toBe(5);

    updates.next({
      data: [
        {
          frameId: 1,
          frameStart: 0,
          frameEnd: 4000,
          totalFrameTime: 0,
          boxFilter: 7
        }
      ]
    });
    await testFixture.whenStable();
    expect(testComponent.performanceDataFilterVis.length).toBe(1);
    expect(testComponent.performanceDataFilterVis[0].totalFilter).toBe(7);
    expect(testComponent.performanceDataProcessingVis.length).toBe(1);
    expect(testComponent.performanceDataCompleteTimeFrameVis.length).toBe(1);
    expect(testComponent.performanceDataCompleteTimeFrameVis[0].frameStart).toBe(0);
    expect(testComponent.performanceDataCompleteTimeFrameVis[0].frameEnd).toBe(
      5000
    );
    expect(
      testComponent.performanceDataCompleteTimeFrameVis[0].totalFrameTime
    ).toBe(5);
  });
});
