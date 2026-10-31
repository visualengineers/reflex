import { By } from '@angular/platform-browser';
import { component, fixture, setupTests } from './tracking.component.1.test-context';
import { camera0, camera1, camera2, logService, trackingService } from './tracking.component.test-data';

describe('TrackingComponent', () => {
  setupTests();

  it('should update selected camera and config correctly', async () => {
    // now execute OnInit()
    fixture.detectChanges();
    await await fixture.whenStable();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

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

    camSelectionElem.value = camSelectionElem.options[0].value;
    camSelectionElem.dispatchEvent(new Event('change'));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.selectedCameraIdx).toEqual(0);
    expect(component.selectedConfigurationIdx).toBe(-1);

    expect(trackingService.getConfigurationsForCamera).toHaveBeenCalledTimes(2);
    expect(trackingService.getConfigurationsForCamera).toHaveBeenCalledWith(0);
    expect(trackingService.getConfigurationsForCamera).toHaveBeenCalledWith(1);
    expect(trackingService.getSelectedCameraConfig).toHaveBeenCalledTimes(2);

    expect(component.canStart).toBeFalsy();

    expect(component.configurations).toHaveLength(2);
    expect(component.configurations).toContain(camera0.streamParameter);
    expect(component.configurations).toContain(camera2.streamParameter);
    expect(component.configurations).not.toContain(camera1.streamParameter);

    // query selection
    const cfgSelectionDbg = fixture.debugElement.query(
      By.css('#tracking-configuration-select')
    );
    expect(cfgSelectionDbg).toBeTruthy();

    const cfgSelectionElem = cfgSelectionDbg.nativeElement as HTMLSelectElement;
    expect(cfgSelectionElem).toBeTruthy();
    expect(cfgSelectionElem.selectedIndex).toEqual(-1);

    cfgSelectionElem.value = cfgSelectionElem.options[1].value;
    cfgSelectionElem.dispatchEvent(new Event('change'));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.selectedCameraIdx).toEqual(0);
    expect(component.selectedConfigurationIdx).toBe(1);

    expect(trackingService.getConfigurationsForCamera).toHaveBeenCalledTimes(2);
    expect(trackingService.getConfigurationsForCamera).toHaveBeenCalledWith(0);
    expect(trackingService.getConfigurationsForCamera).toHaveBeenCalledWith(1);
    expect(trackingService.getSelectedCameraConfig).toHaveBeenCalledTimes(2);

    expect(component.canStart).toBeTruthy();
  });
});
