import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TrackingComponent } from './tracking.component';
import { TrackingService } from 'src/shared/services/tracking.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { LogService } from '../log/log.service';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MockDepthImageComponent } from './depth-image/depth-image.component.mock';
import { MockPointCloudComponent } from './point-cloud/point-cloud.component.mock';
import { MockRecordingComponent } from './recording/recording.component.mock';
import { MockSettingsComponent } from '../settings/settings.component.mock';
import { By } from '@angular/platform-browser';
import { DEFAULT_SETTINGS, DepthCamera, DepthCameraState, TrackingConfigState } from '@reflex/shared-types';
import { MockPanelHeaderComponent, MockValueSelectionComponent, PanelHeaderComponent, ValueSelectionComponent } from '@reflex/angular-components/dist';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { SettingsComponent } from '../settings/settings.component';
import { DepthImageComponent } from './depth-image/depth-image.component';
import { PointCloudComponent } from './point-cloud/point-cloud.component';
import { RecordingComponent } from './recording/recording.component';

const trackingService = jasmine.createSpyObj<TrackingService>('fakeTrackingService',
    [
      'getStatus',
      'getCameras',
      'queryAutostartEnabled',
      'getSelectedCamera',
      'getConfigurationsForCamera',
      'getSelectedCameraConfig',
      'toggleCamera',
      'setAutostartEnabled'
    ]);

const trackingService_error = jasmine.createSpyObj<TrackingService>('fakeTrackingServiceThrowsErrors',
  [
    'getStatus',
    'getCameras',
    'queryAutostartEnabled',
    'getSelectedCamera',
    'getConfigurationsForCamera',
    'getSelectedCameraConfig',
    'toggleCamera',
    'setAutostartEnabled'
  ]);

const camera0: DepthCamera = {
  id: '0',
  modelDescription: 'ZERO',
  state: DepthCameraState.Disconnected,
  streamParameter: {
    name: 'ZeroCam',
    framerate: 0,
    width: 10,
    height: 5
  }
};

const camera1: DepthCamera = {
  id: '1',
  modelDescription: 'TestCamera',
  state: DepthCameraState.Streaming,
  streamParameter: {
    name: 'TestConfig',
    framerate: 30,
    width: 100,
    height: 50
  }
};

const camera2: DepthCamera = {
  id: '2',
  modelDescription: 'AnotherCam',
  state: DepthCameraState.Connected,
  streamParameter: {
    name: 'AnotherConfig',
    framerate: 60,
    width: 640,
    height: 480
  }
};

const state: TrackingConfigState = {
  isCameraSelected: true,
  selectedCameraName: 'TestCamera',
  selectedConfigurationName: 'TestConfig',
  depthCameraStateName: DepthCameraState[camera1.state]
};

const state2: TrackingConfigState = {
  isCameraSelected: true,
  selectedCameraName: 'ZERO',
  selectedConfigurationName: '',
  depthCameraStateName: DepthCameraState[camera0.state]
}

trackingService.getCameras.and.returnValue(of([
  camera0, camera1, camera2
]));


trackingService.queryAutostartEnabled.and.returnValue(of('true'));

trackingService.getStatus.and.returnValue(of(state));

trackingService.getSelectedCamera.and.returnValue(of(camera1));

trackingService.getConfigurationsForCamera.withArgs(1).and.returnValue(of([camera1.streamParameter]));
trackingService.getConfigurationsForCamera.withArgs(0).and.returnValue(of([camera2.streamParameter, camera0.streamParameter]));

trackingService.getSelectedCameraConfig.and.returnValue(of(camera1.streamParameter));

const errorCam = 'TestError: getCameras()';
trackingService_error.getCameras.and.returnValue(throwError(errorCam));

const errorAutostart = 'TestError: queryAutostartEnabled()';
trackingService_error.queryAutostartEnabled.and.returnValue(throwError(errorAutostart));

const errorStatus = 'TestError: getStatus()';
trackingService_error.getStatus.and.returnValue(throwError(errorStatus));

const errorSelectCam = 'TestError: getSelectedCamera()';
trackingService_error.getSelectedCamera.and.returnValue(throwError(errorSelectCam));

const errorConfigCam = 'TestError: getConfigurationsForCamera()';
trackingService_error.getConfigurationsForCamera.and.returnValue(throwError(errorConfigCam));

const errorSelectConfig = 'TestError: getSelectedCameraConfig()';
trackingService_error.getSelectedCameraConfig.and.returnValue(throwError(errorSelectConfig));

const errorToggle = 'TestError: toggleCamera()';
trackingService_error.toggleCamera.and.returnValue(throwError(errorToggle));

const errorSaveAutoStart = 'TestError: setAutostartEnabled()';
trackingService_error.setAutostartEnabled.and.returnValue(throwError(errorSaveAutoStart));

const settingsService = jasmine.createSpyObj<SettingsService>('fakeSettingsService',
  [
    'getSettings',
    'getCanRestore',
    'update'
  ]);
const logService = jasmine.createSpyObj<LogService>('fakeLogService',
  [
    'sendErrorLog'
  ]);

settingsService.getSettings.and.returnValue(of(DEFAULT_SETTINGS));
settingsService.getCanRestore.and.returnValue(of({ name: 'canRestore', value: true }));

xdescribe('TrackingComponent', () => {
  let component: TrackingComponent;
  let fixture: ComponentFixture<TrackingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [
        CommonModule,
        FormsModule,
        TrackingComponent
      ],
    providers: [
        { provide: 'BASE_URL', useValue: '', deps: [] },
        {
            provide: TrackingService, useValue: trackingService
        },
        {
            provide: SettingsService, useValue: settingsService
        },
        {
            provide: LogService, useValue: logService
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
    })
    .overrideComponent(TrackingComponent, {
      remove: { imports: [
        PanelHeaderComponent,
        ValueSelectionComponent,
        RecordingComponent,
        SettingsComponent,
        PointCloudComponent,
        DepthImageComponent
      ] },
      add: { imports: [
        MockPanelHeaderComponent,
        MockValueSelectionComponent,
        MockRecordingComponent,
        MockSettingsComponent,
        MockPointCloudComponent,
        MockDepthImageComponent ] }
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackingComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();

    trackingService.getStatus.calls.reset();
    trackingService.getCameras.calls.reset();
    trackingService.queryAutostartEnabled.calls.reset();
    trackingService.getSelectedCamera.calls.reset();
    trackingService.getConfigurationsForCamera.calls.reset();
    trackingService.getSelectedCameraConfig.calls.reset();
    trackingService.toggleCamera.calls.reset();
    trackingService.setAutostartEnabled.calls.reset();

    settingsService.update.calls.reset();

    logService.sendErrorLog.calls.reset();
  });

  afterAll(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  })

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
    await fixture.whenStable();

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
    expect(component.statusDetailsText).toEqual(state.selectedConfigurationName);

    expect(component.selectedCameraIdx).toBe(1);
    expect(component.selectedConfigurationIdx).toBe(0);

    expect(component.canStart).toBe(true);

    expect(component['statusSubscription']).toBeDefined();
    expect(component['autostartSubscription']).toBeDefined();
    expect(component['selectedCamSubscription']).toBeDefined();
  });

  it('should update selected camera and config correctly', async () => {
    // now execute OnInit()
    fixture.detectChanges();
    await fixture.whenStable();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    // query selection
    const selectionDbg  = fixture.debugElement.query(By.css('#tracking-camera-select'));
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

    expect(component.configurations).toHaveSize(2);
    expect(component.configurations).toContain(camera0.streamParameter);
    expect(component.configurations).toContain(camera2.streamParameter);
    expect(component.configurations).not.toContain(camera1.streamParameter);

    // query selection
    const cfgSelectionDbg  = fixture.debugElement.query(By.css('#tracking-configuration-select'));
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

  it('should correctly deselect camera and configurations', async () => {
    // now execute OnInit()
    fixture.detectChanges();
    await fixture.whenStable();

    // query selection
    const selectionDbg  = fixture.debugElement.query(By.css('#tracking-camera-select'));
    expect(selectionDbg).toBeTruthy();

    const camSelectionElem = selectionDbg.nativeElement as HTMLSelectElement;
    expect(camSelectionElem).toBeTruthy();
    expect(camSelectionElem.selectedIndex).toEqual(1);

    expect(trackingService.getConfigurationsForCamera).toHaveBeenCalledTimes(1);
    expect(trackingService.getConfigurationsForCamera).toHaveBeenCalledWith(1);
    expect(trackingService.getSelectedCameraConfig).toHaveBeenCalledTimes(1);

    trackingService.getSelectedCameraConfig.calls.reset();

    component.selectedCameraIdx = -1;
    component.updateConfigurations();

    expect(component.configurations).toEqual([]);
    expect(component.configurations).toHaveSize(0);

    expect(trackingService.getSelectedCameraConfig).not.toHaveBeenCalled();

    expect(component.selectedConfigurationIdx).toEqual(-1);
    expect(component.canStart).toBeFalsy();

  });

  it('should correctly toggle camera with current config', async () => {

    fixture.detectChanges();
    await fixture.whenStable();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(component.isActive).toBeTruthy();
    expect(component.selectedCameraIdx).toBe(1);
    expect(component.selectedConfigurationIdx).toBe(0);

    trackingService.toggleCamera.and.returnValue(of(true));

    settingsService.update.calls.reset();

    component.start();

    expect(trackingService.toggleCamera).toHaveBeenCalledWith(1,0);
    expect(trackingService.toggleCamera).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(settingsService.update).toHaveBeenCalledTimes(1);
  });

  it('should correctly save autostart', async () => {

    fixture.detectChanges();
    await fixture.whenStable();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    trackingService.setAutostartEnabled.and.returnValue(of(true));

    settingsService.update.calls.reset();

    component.saveAutoStart();

    expect(trackingService.setAutostartEnabled).toHaveBeenCalledWith(true);
    expect(trackingService.setAutostartEnabled).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(settingsService.update).toHaveBeenCalledTimes(1);
  });

  it('should correctly toggle between DepthImage and PointCloud when setting them to fullscreen ', async () => {

    fixture.detectChanges();
    await fixture.whenStable();

    component.onDepthImageFullScreenChanged(true);
    expect(component.displayPointCloud).toBe(false);

    component.onDepthImageFullScreenChanged(true);
    expect(component.displayPointCloud).toBe(false);

    component.onPointCloudFullScreenChanged(true);
    expect(component.displayDepthImage).toBe(false);

    component.onDepthImageFullScreenChanged(false);
    expect(component.displayPointCloud).toBe(true);

    component.onPointCloudFullScreenChanged(false);
    expect(component.displayDepthImage).toBe(true);
  });

  it ('should unsubscribe completely onDestroy', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.ngOnDestroy();

    expect(component['statusSubscription']?.closed).toBeTruthy();
    expect(component['autostartSubscription']?.closed).toBeTruthy();
    expect(component['selectedCamSubscription']?.closed).toBeTruthy();
    expect(component['configSubscription'] === undefined || component['configSubscription'].closed).toBeTrue();
    expect(component['selectedCamConfigSubscription'] === undefined || component['selectedCamConfigSubscription'].closed).toBeTrue();
    expect(component['cameraSubscription'] === undefined || component['cameraSubscription'].closed).toBeTrue();

  });
});

describe('TrackingComponent: Test Service throwing Errors', () => {
  let component: TrackingComponent;
  let fixture: ComponentFixture<TrackingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [
        FormsModule,
        CommonModule,
        TrackingComponent
      ],
    providers: [
        {
            provide: TrackingService, useValue: trackingService_error
        },
        {
            provide: SettingsService, useValue: settingsService
        },
        {
            provide: LogService, useValue: logService
        },
        {
          provide: 'BASE_URL', useValue: 'http://localhost'
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
  })
  .overrideComponent(TrackingComponent, {
    remove: { imports: [
      PanelHeaderComponent,
      ValueSelectionComponent,
      RecordingComponent,
      SettingsComponent,
      PointCloudComponent,
      DepthImageComponent
    ] },
    add: { imports: [
      MockPanelHeaderComponent,
      MockValueSelectionComponent,
      MockRecordingComponent,
      MockSettingsComponent,
      MockPointCloudComponent,
      MockDepthImageComponent ] }
  })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackingComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();

    trackingService_error.getStatus.calls.reset();
    trackingService_error.getCameras.calls.reset();
    trackingService_error.queryAutostartEnabled.calls.reset();
    trackingService_error.getSelectedCamera.calls.reset();
    trackingService_error.getConfigurationsForCamera.calls.reset();
    trackingService_error.getSelectedCameraConfig.calls.reset();
    trackingService_error.toggleCamera.calls.reset();
    trackingService_error.setAutostartEnabled.calls.reset();

    settingsService.update.calls.reset();

    logService.sendErrorLog.calls.reset();
  });

  afterAll(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  })

  it('should handle errors correctly', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    // handle errors when initializing

    expect(trackingService_error.getCameras).toHaveBeenCalledTimes(1);
    expect(trackingService_error.queryAutostartEnabled).toHaveBeenCalledTimes(1);
    expect(trackingService_error.getSelectedCamera).toHaveBeenCalledTimes(1);
    expect(trackingService_error.getStatus).toHaveBeenCalledTimes(1);

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

    expect(trackingService_error.getConfigurationsForCamera).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(5)
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorConfigCam);

    component.start();

    expect(trackingService_error.toggleCamera).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(6)
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorToggle);

    component.saveAutoStart();

    expect(trackingService_error.setAutostartEnabled).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(7)
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSaveAutoStart);

    fixture.destroy();
    TestBed.resetTestingModule();
  });

});
