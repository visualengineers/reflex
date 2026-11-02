import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { queryElement } from '../../../../../../test/helpers/dom';
import {
  mount,
  processing,
  setupTests as setupZonelessTests
} from '../test-utils/zoneless-change-detection.test-context';
import { HistoryComponent } from './history/history.component';
import { MockHistoryComponent } from './history/history.component.mock';
import { InteractionsVisualizationComponent } from './interactions-visualization/interactions-visualization.component';
import {
  MockInteractionsVisualizationComponent
} from './interactions-visualization/interactions-visualization.component.mock';
import { InteractionsComponent } from './interactions/interactions.component';
import { MockInteractionsComponent } from './interactions/interactions.component.mock';
import { ProcessingComponent } from './processing.component';
import { component as testComponent, fixture as testFixture, setupTests } from './processing.component.test-context';
import {
  calibrationService,
  logService,
  processingService,
  remoteObserver,
  settingsService
} from './processing.component.test-data';

describe('Zoneless change detection: renders processing status even when no interactions arrive', () => {
  setupZonelessTests();

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

describe('ProcessingComponent', () => {
  setupTests();

  it('should create', () => {
    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();

    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledTimes(1);

    expect(processingService.getInteractions).toHaveBeenCalledTimes(1);
    // BUG ?
    expect(processingService.getStatus).toHaveBeenCalledTimes(2);

    expect(processingService.getObserverTypes).toHaveBeenCalledTimes(1);
    expect(processingService.getSelectedObserverType).toHaveBeenCalledTimes(1);
    expect(processingService.getInterval).toHaveBeenCalledTimes(1);
    expect(processingService.getRemoteProcessorSettings).toHaveBeenCalledTimes(
      1
    );

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);

    expect(settingsService.saveSettings).not.toHaveBeenCalled();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('loads, updates and saves gzip compression through the shared checkbox', async () => {
    processingService.getSelectedObserverType.mockReturnValue(of(3));
    testFixture.detectChanges();
    await testFixture.whenStable();
    testFixture.detectChanges();
    const checkbox: HTMLInputElement = queryElement((testFixture.nativeElement as HTMLInputElement), '#processing-remote-gzipCompression-checkbox');
    expect(checkbox.checked).toBe(true);

    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    testFixture.detectChanges();
    await await testFixture.whenStable();

    expect(testComponent.remoteSettings.useGzipCompression).toBe(false);
    expect(processingService.setRemoteProcessorSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        useGzipCompression: false,
        address: remoteObserver.address,
        factor: remoteObserver.factor
      })
    );

    testComponent.saveRemoteProcessingSettings();
    expect(settingsService.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteProcessingServiceSettingsValues: expect.objectContaining({ useGzipCompression: false }) as unknown
      })
    );

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    testFixture.detectChanges();
    await testFixture.whenStable();
    expect(processingService.setRemoteProcessorSettings).toHaveBeenLastCalledWith(expect.objectContaining({ useGzipCompression: true }));
  });
});
