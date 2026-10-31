import { of } from 'rxjs';
import { queryElement } from '../../../../../../test/helpers/dom';
import { component, fixture, setupTests } from './processing.component.test-context';
import { calibrationService, logService, processingService, remoteObserver, settingsService } from './processing.component.test-data';

describe('ProcessingComponent', () => {
  setupTests();

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();

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
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const checkbox: HTMLInputElement = queryElement((fixture.nativeElement as HTMLInputElement), '#processing-remote-gzipCompression-checkbox');
    expect(checkbox.checked).toBe(true);

    checkbox.checked = false;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await await fixture.whenStable();

    expect(component.remoteSettings.useGzipCompression).toBe(false);
    expect(processingService.setRemoteProcessorSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        useGzipCompression: false,
        address: remoteObserver.address,
        factor: remoteObserver.factor
      })
    );

    component.saveRemoteProcessingSettings();
    expect(settingsService.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteProcessingServiceSettingsValues: expect.objectContaining({ useGzipCompression: false }) as unknown
      })
    );

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(processingService.setRemoteProcessorSettings).toHaveBeenLastCalledWith(expect.objectContaining({ useGzipCompression: true }));
  });
});
