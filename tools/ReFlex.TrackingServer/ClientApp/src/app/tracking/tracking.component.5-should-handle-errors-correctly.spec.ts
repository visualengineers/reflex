import { TestBed } from '@angular/core/testing';
import { component, fixture, setupTests } from './tracking.component.2.test-context';
import { errorAutostart, errorCam, errorConfigCam, errorSaveAutoStart, errorSelectCam, errorStatus, errorToggle, logService, trackingServiceError } from './tracking.component.test-data';

describe('TrackingComponent: Test Service throwing Errors', () => {
  setupTests();

  it('should handle errors correctly', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    // handle errors when initializing

    expect(trackingServiceError.getCameras).toHaveBeenCalledTimes(1);
    expect(trackingServiceError.queryAutostartEnabled).toHaveBeenCalledTimes(
      1
    );
    expect(trackingServiceError.getSelectedCamera).toHaveBeenCalledTimes(1);
    expect(trackingServiceError.getStatus).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(4);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorAutostart);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorCam);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSelectCam);

    expect(component).toBeTruthy();
    expect(component.canStart).toBeFalsy();
    expect(component.selectedCameraIdx).toBe(-1);
    expect(component.selectedConfigurationIdx).toBe(-1);

    component.selectedCameraIdx = 1;
    component.updateConfigurations();

    expect(
      trackingServiceError.getConfigurationsForCamera
    ).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(5);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorConfigCam);

    component.start();

    expect(trackingServiceError.toggleCamera).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(6);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorToggle);

    component.saveAutoStart();

    expect(trackingServiceError.setAutostartEnabled).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(7);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSaveAutoStart);

    fixture.destroy();
    TestBed.resetTestingModule();
  });
});
