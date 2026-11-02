import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DepthCamera, DepthCameraState, TrackingConfigState } from '@reflex/shared-types';
import { Subject, of } from 'rxjs';
import { queryElement } from '../../../../../../test/helpers/dom';
import {
  isolateTracking,
  mount,
  setupTests as setupZonelessTests,
  text,
  tracking
} from '../test-utils/zoneless-change-detection.test-context';
import { streaming } from '../test-utils/zoneless-change-detection.test-data';
import { TrackingComponent } from './tracking.component';
import { component as testComponent, fixture as testFixture, setupTests } from './tracking.component.1.test-context';
import {
  component as errorComponent,
  fixture as errorFixture,
  setupTests as setupErrorTests
} from './tracking.component.2.test-context';
import {
  camera0,
  camera1,
  camera2,
  errorAutostart,
  errorCam,
  errorConfigCam,
  errorSaveAutoStart,
  errorSelectCam,
  errorStatus,
  errorToggle,
  logService,
  settingsService,
  state,
  trackingService,
  trackingServiceError
} from './tracking.component.test-data';

describe('Zoneless change detection: renders a delayed camera-list HTTP response', () => {
  setupZonelessTests();

  it('renders a delayed camera-list HTTP response', async () => {
    isolateTracking();
    const response = new Subject<Array<DepthCamera>>();
    tracking.getCameras.mockReturnValue(response);
    const fixture = await mount(TrackingComponent);
    response.next([
      {
        id: '42',
        modelDescription: 'Async camera',
        state: DepthCameraState.Connected,
        streamParameter: {
          name: 'config',
          width: 128,
          height: 96,
          framerate: 30
        }
      }
    ]);
    await fixture.whenStable();
    expect(
      queryElement<HTMLSelectElement>((fixture.nativeElement as HTMLInputElement), '#tracking-camera-select').textContent
    ).toContain('Async camera');
  });
});

describe('Zoneless change detection: renders SignalR camera status without another UI event', () => {
  setupZonelessTests();

  it('renders SignalR camera status without another UI event', async () => {
    isolateTracking();
    const status = new Subject<TrackingConfigState>();
    tracking.getStatus.mockReturnValue(status);
    const fixture = await mount(TrackingComponent);
    status.next(streaming);
    await fixture.whenStable();
    expect(text(fixture)).toContain('Streaming');
  });
});

describe('TrackingComponent', () => {
  setupTests();

  it('should create', () => {
    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();
  });

  it('should initialize subscriptions in OnInit', async () => {
    expect(trackingService.getCameras).not.toHaveBeenCalled();
    expect(trackingService.queryAutostartEnabled).not.toHaveBeenCalled();
    expect(trackingService.getStatus).not.toHaveBeenCalled();
    expect(trackingService.getSelectedCamera).not.toHaveBeenCalled();
    expect(settingsService.update).not.toHaveBeenCalled();
    expect(trackingService.getSelectedCameraConfig).not.toHaveBeenCalled();

    // now execute OnInit()
    testFixture.detectChanges();
    await await testFixture.whenStable();

    expect(trackingService.getCameras).toHaveBeenCalledTimes(1);
    expect(trackingService.queryAutostartEnabled).toHaveBeenCalledTimes(1);
    expect(trackingService.getStatus).toHaveBeenCalledTimes(1);
    expect(trackingService.getSelectedCamera).toHaveBeenCalledTimes(1);
    expect(trackingService.getSelectedCameraConfig).toHaveBeenCalledTimes(1);
    expect(settingsService.update).toHaveBeenCalledTimes(2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(testComponent.cameras).toContain(camera0);
    expect(testComponent.cameras).toContain(camera1);
    expect(testComponent.cameras).toContain(camera2);

    expect(testComponent.autostart).toBe(true);

    expect(testComponent.isActive).toBe(true);

    expect(testComponent.statusText).toEqual(state.depthCameraStateName);
    expect(testComponent.statusDetailsText).toEqual(
      state.selectedConfigurationName
    );

    expect(testComponent.selectedCameraIdx).toBe(1);
    expect(testComponent.selectedConfigurationIdx).toBe(0);

    expect(testComponent.canStart).toBe(true);

    expect(testComponent['statusSubscription']).toBeDefined();
    expect(testComponent['autostartSubscription']).toBeDefined();
    expect(testComponent['selectedCamSubscription']).toBeDefined();
  });
});

describe('TrackingComponent', () => {
  setupTests();

  it('should update selected camera and config correctly', async () => {
    // now execute OnInit()
    testFixture.detectChanges();
    await await testFixture.whenStable();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    // query selection
    const selectionDbg = testFixture.debugElement.query(
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

    testFixture.detectChanges();
    await testFixture.whenStable();

    expect(testComponent.selectedCameraIdx).toEqual(0);
    expect(testComponent.selectedConfigurationIdx).toBe(-1);

    expect(trackingService.getConfigurationsForCamera).toHaveBeenCalledTimes(2);
    expect(trackingService.getConfigurationsForCamera).toHaveBeenCalledWith(0);
    expect(trackingService.getConfigurationsForCamera).toHaveBeenCalledWith(1);
    expect(trackingService.getSelectedCameraConfig).toHaveBeenCalledTimes(2);

    expect(testComponent.canStart).toBeFalsy();

    expect(testComponent.configurations).toHaveLength(2);
    expect(testComponent.configurations).toContain(camera0.streamParameter);
    expect(testComponent.configurations).toContain(camera2.streamParameter);
    expect(testComponent.configurations).not.toContain(camera1.streamParameter);

    // query selection
    const cfgSelectionDbg = testFixture.debugElement.query(
      By.css('#tracking-configuration-select')
    );
    expect(cfgSelectionDbg).toBeTruthy();

    const cfgSelectionElem = cfgSelectionDbg.nativeElement as HTMLSelectElement;
    expect(cfgSelectionElem).toBeTruthy();
    expect(cfgSelectionElem.selectedIndex).toEqual(-1);

    cfgSelectionElem.value = cfgSelectionElem.options[1].value;
    cfgSelectionElem.dispatchEvent(new Event('change'));

    testFixture.detectChanges();
    await testFixture.whenStable();

    expect(testComponent.selectedCameraIdx).toEqual(0);
    expect(testComponent.selectedConfigurationIdx).toBe(1);

    expect(trackingService.getConfigurationsForCamera).toHaveBeenCalledTimes(2);
    expect(trackingService.getConfigurationsForCamera).toHaveBeenCalledWith(0);
    expect(trackingService.getConfigurationsForCamera).toHaveBeenCalledWith(1);
    expect(trackingService.getSelectedCameraConfig).toHaveBeenCalledTimes(2);

    expect(testComponent.canStart).toBeTruthy();
  });
});

describe('TrackingComponent', () => {
  setupTests();

  it('should correctly deselect camera and configurations', async () => {
    // now execute OnInit()
    testFixture.detectChanges();
    await testFixture.whenStable();

    // query selection
    const selectionDbg = testFixture.debugElement.query(
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

    testComponent.selectedCameraIdx = -1;
    testComponent.updateConfigurations();

    expect(testComponent.configurations).toEqual([]);
    expect(testComponent.configurations).toHaveLength(0);

    expect(trackingService.getSelectedCameraConfig).not.toHaveBeenCalled();

    expect(testComponent.selectedConfigurationIdx).toEqual(-1);
    expect(testComponent.canStart).toBeFalsy();
  });

  it('should correctly toggle camera with current config', async () => {
    testFixture.detectChanges();
    await await testFixture.whenStable();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(testComponent.isActive).toBeTruthy();
    expect(testComponent.selectedCameraIdx).toBe(1);
    expect(testComponent.selectedConfigurationIdx).toBe(0);

    trackingService.toggleCamera.mockReturnValue(of(202));

    settingsService.update.mockClear();

    testComponent.start();

    expect(trackingService.toggleCamera).toHaveBeenCalledWith(1, 0);
    expect(trackingService.toggleCamera).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(settingsService.update).toHaveBeenCalledTimes(1);
  });

  it('should correctly save autostart', async () => {
    testFixture.detectChanges();
    await testFixture.whenStable();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    trackingService.setAutostartEnabled.mockReturnValue(of(true));

    settingsService.update.mockClear();

    testComponent.saveAutoStart();

    expect(trackingService.setAutostartEnabled).toHaveBeenCalledWith(true);
    expect(trackingService.setAutostartEnabled).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(settingsService.update).toHaveBeenCalledTimes(1);
  });
});

describe('TrackingComponent', () => {
  setupTests();

  it('should correctly toggle between DepthImage and PointCloud when setting them to fullscreen ', async () => {
    testFixture.detectChanges();
    await testFixture.whenStable();

    testComponent.onDepthImageFullScreenChanged(true);
    expect(testComponent.displayPointCloud).toBe(false);

    testComponent.onDepthImageFullScreenChanged(true);
    expect(testComponent.displayPointCloud).toBe(false);

    testComponent.onPointCloudFullScreenChanged(true);
    expect(testComponent.displayDepthImage).toBe(false);

    testComponent.onDepthImageFullScreenChanged(false);
    expect(testComponent.displayPointCloud).toBe(true);

    testComponent.onPointCloudFullScreenChanged(false);
    expect(testComponent.displayDepthImage).toBe(true);
  });

  it('should unsubscribe completely onDestroy', async () => {
    testFixture.detectChanges();
    await testFixture.whenStable();

    testComponent.ngOnDestroy();

    expect(testComponent['statusSubscription']?.closed).toBeTruthy();
    expect(testComponent['autostartSubscription']?.closed).toBeTruthy();
    expect(testComponent['selectedCamSubscription']?.closed).toBeTruthy();
    expect(
      testComponent['configSubscription'] === undefined
        || testComponent['configSubscription'].closed
    ).toBe(true);
    expect(
      testComponent['selectedCamConfigSubscription'] === undefined
        || testComponent['selectedCamConfigSubscription'].closed
    ).toBe(true);
    expect(
      testComponent['cameraSubscription'] === undefined
        || testComponent['cameraSubscription'].closed
    ).toBe(true);
  });
});

describe('TrackingComponent: Test Service throwing Errors', () => {
  setupErrorTests();

  it('should handle errors correctly', async () => {
    errorFixture.detectChanges();
    await errorFixture.whenStable();

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

    expect(errorComponent).toBeTruthy();
    expect(errorComponent.canStart).toBeFalsy();
    expect(errorComponent.selectedCameraIdx).toBe(-1);
    expect(errorComponent.selectedConfigurationIdx).toBe(-1);

    errorComponent.selectedCameraIdx = 1;
    errorComponent.updateConfigurations();

    expect(
      trackingServiceError.getConfigurationsForCamera
    ).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(5);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorConfigCam);

    errorComponent.start();

    expect(trackingServiceError.toggleCamera).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(6);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorToggle);

    errorComponent.saveAutoStart();

    expect(trackingServiceError.setAutostartEnabled).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(7);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSaveAutoStart);

    errorFixture.destroy();
    TestBed.resetTestingModule();
  });
});
