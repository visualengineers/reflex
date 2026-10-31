import { TestBed } from '@angular/core/testing';
import {
  DEFAULT_SETTINGS,
  PerformanceData
} from '@reflex/shared-types';
import { Subject, of } from 'rxjs';
import { queryElement } from '../../../../../test/helpers/dom';
import { HistoryComponent } from './processing/history/history.component';
import { MockHistoryComponent } from './processing/history/history.component.mock';
import { InteractionsVisualizationComponent } from './processing/interactions-visualization/interactions-visualization.component';
import { MockInteractionsVisualizationComponent } from './processing/interactions-visualization/interactions-visualization.component.mock';
import { InteractionsComponent } from './processing/interactions/interactions.component';
import { MockInteractionsComponent } from './processing/interactions/interactions.component.mock';
import { ProcessingComponent } from './processing/processing.component';
import { SettingsComponent } from './settings/settings.component';
import { mount, performance, processing, settings, setupTests, text, tracking } from './zoneless-change-detection.test-context';
import { streaming } from './zoneless-change-detection.test-data';

describe('TrackingServer zoneless DOM updates', () => {
  setupTests();

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

  it('renders processing status even when no interactions arrive', async () => {
    TestBed.overrideComponent(ProcessingComponent, {
      remove: {
        imports: [
          InteractionsComponent,
          InteractionsVisualizationComponent,
          HistoryComponent
        ]
      },
      add: {
        imports: [
          MockInteractionsComponent,
          MockInteractionsVisualizationComponent,
          MockHistoryComponent
        ]
      }
    });
    const response = new Subject<string>();
    processing.getStatus.mockReturnValue(response);
    const fixture = await mount(ProcessingComponent);
    response.next('Active');
    await fixture.whenStable();
    expect(queryElement((fixture.nativeElement as HTMLInputElement), 'h3').textContent).toContain(
      'Active'
    );
  });
});
