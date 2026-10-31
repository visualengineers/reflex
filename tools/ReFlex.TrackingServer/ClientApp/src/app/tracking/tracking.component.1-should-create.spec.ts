import { component, fixture, setupTests } from './tracking.component.1.test-context';
import { camera0, camera1, camera2, logService, settingsService, state, trackingService } from './tracking.component.test-data';

describe('TrackingComponent', () => {
  setupTests();

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should initialize subscriptions in OnInit', async () => {
    expect(trackingService.getCameras).not.toHaveBeenCalled();
    expect(trackingService.queryAutostartEnabled).not.toHaveBeenCalled();
    expect(trackingService.getStatus).not.toHaveBeenCalled();
    expect(trackingService.getSelectedCamera).not.toHaveBeenCalled();
    expect(settingsService.update).not.toHaveBeenCalled();
    expect(trackingService.getSelectedCameraConfig).not.toHaveBeenCalled();

    // now execute OnInit()
    fixture.detectChanges();
    await await fixture.whenStable();

    expect(trackingService.getCameras).toHaveBeenCalledTimes(1);
    expect(trackingService.queryAutostartEnabled).toHaveBeenCalledTimes(1);
    expect(trackingService.getStatus).toHaveBeenCalledTimes(1);
    expect(trackingService.getSelectedCamera).toHaveBeenCalledTimes(1);
    expect(trackingService.getSelectedCameraConfig).toHaveBeenCalledTimes(1);
    expect(settingsService.update).toHaveBeenCalledTimes(2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(component.cameras).toContain(camera0);
    expect(component.cameras).toContain(camera1);
    expect(component.cameras).toContain(camera2);

    expect(component.autostart).toBe(true);

    expect(component.isActive).toBe(true);

    expect(component.statusText).toEqual(state.depthCameraStateName);
    expect(component.statusDetailsText).toEqual(
      state.selectedConfigurationName
    );

    expect(component.selectedCameraIdx).toBe(1);
    expect(component.selectedConfigurationIdx).toBe(0);

    expect(component.canStart).toBe(true);

    expect(component['statusSubscription']).toBeDefined();
    expect(component['autostartSubscription']).toBeDefined();
    expect(component['selectedCamSubscription']).toBeDefined();
  });
});
