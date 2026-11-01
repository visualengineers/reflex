import { DEFAULT_SETTINGS, TrackingServerAppSettings, PerformanceData } from '@reflex/shared-types';
import { Subject, of } from 'rxjs';
import { queryElement } from '../../../../../../test/helpers/dom';
import {
  mount,
  settings,
  setupTests as setupZonelessTests,
  performance,
  text,
  tracking
} from '../test-utils/zoneless-change-detection.test-context';
import { streaming } from '../test-utils/zoneless-change-detection.test-data';
import { SettingsComponent } from './settings.component';

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
});
