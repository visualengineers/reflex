import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { component, fixture, setupTests } from './tracking.component.1.test-context';
import { logService, settingsService, trackingService } from './tracking.component.test-data';

describe('TrackingComponent', () => {
  setupTests();

  it('should correctly deselect camera and configurations', async () => {
    // now execute OnInit()
    fixture.detectChanges();
    await fixture.whenStable();

    // query selection
    const selectionDbg = fixture.debugElement.query(
      By.css('#tracking-camera-select')
    );
    expect(selectionDbg).toBeTruthy();

    const camSelectionElem = selectionDbg.nativeElement as HTMLSelectElement;
    expect(camSelectionElem).toBeTruthy();
    expect(camSelectionElem.selectedIndex).toEqual(1);

    expect(trackingService.getConfigurationsForCamera).toHaveBeenCalledTimes(1);
    expect(trackingService.getConfigurationsForCamera).toHaveBeenCalledWith(1);
    expect(trackingService.getSelectedCameraConfig).toHaveBeenCalledTimes(1);

    trackingService.getSelectedCameraConfig.mockClear();

    component.selectedCameraIdx = -1;
    component.updateConfigurations();

    expect(component.configurations).toEqual([]);
    expect(component.configurations).toHaveLength(0);

    expect(trackingService.getSelectedCameraConfig).not.toHaveBeenCalled();

    expect(component.selectedConfigurationIdx).toEqual(-1);
    expect(component.canStart).toBeFalsy();
  });

  it('should correctly toggle camera with current config', async () => {
    fixture.detectChanges();
    await await fixture.whenStable();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(component.isActive).toBeTruthy();
    expect(component.selectedCameraIdx).toBe(1);
    expect(component.selectedConfigurationIdx).toBe(0);

    trackingService.toggleCamera.mockReturnValue(of(202));

    settingsService.update.mockClear();

    component.start();

    expect(trackingService.toggleCamera).toHaveBeenCalledWith(1, 0);
    expect(trackingService.toggleCamera).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(settingsService.update).toHaveBeenCalledTimes(1);
  });

  it('should correctly save autostart', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    trackingService.setAutostartEnabled.mockReturnValue(of(true));

    settingsService.update.mockClear();

    component.saveAutoStart();

    expect(trackingService.setAutostartEnabled).toHaveBeenCalledWith(true);
    expect(trackingService.setAutostartEnabled).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(settingsService.update).toHaveBeenCalledTimes(1);
  });
});
