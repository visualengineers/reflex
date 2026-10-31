import { mockReturnValueForArgs } from '../../test-utils/mock-return-value-for-args';
import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
import {
  DEFAULT_SETTINGS,
  DepthCamera,
  DepthCameraState,
  TrackingConfigState,
} from '@reflex/shared-types';
import {
  MockPanelHeaderComponent,
  MockValueSelectionComponent,
  PanelHeaderComponent,
  ValueSelectionComponent,
} from '@reflex/angular-components/dist';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { SettingsComponent } from '../settings/settings.component';
import { DepthImageComponent } from './depth-image/depth-image.component';
import { PointCloudComponent } from './point-cloud/point-cloud.component';
import { RecordingComponent } from './recording/recording.component';

const trackingService = {
  getStatus: vi.fn().mockName('fakeTrackingService.getStatus'),
  getCameras: vi.fn().mockName('fakeTrackingService.getCameras'),
  queryAutostartEnabled: vi
    .fn()
    .mockName('fakeTrackingService.queryAutostartEnabled'),
  getSelectedCamera: vi.fn().mockName('fakeTrackingService.getSelectedCamera'),
  getConfigurationsForCamera: vi
    .fn()
    .mockName('fakeTrackingService.getConfigurationsForCamera'),
  getSelectedCameraConfig: vi
    .fn()
    .mockName('fakeTrackingService.getSelectedCameraConfig'),
  toggleCamera: vi.fn().mockName('fakeTrackingService.toggleCamera'),
  setAutostartEnabled: vi
    .fn()
    .mockName('fakeTrackingService.setAutostartEnabled'),
};

const trackingService_error = {
  getStatus: vi.fn().mockName('fakeTrackingServiceThrowsErrors.getStatus'),
  getCameras: vi.fn().mockName('fakeTrackingServiceThrowsErrors.getCameras'),
  queryAutostartEnabled: vi
    .fn()
    .mockName('fakeTrackingServiceThrowsErrors.queryAutostartEnabled'),
  getSelectedCamera: vi
    .fn()
    .mockName('fakeTrackingServiceThrowsErrors.getSelectedCamera'),
  getConfigurationsForCamera: vi
    .fn()
    .mockName('fakeTrackingServiceThrowsErrors.getConfigurationsForCamera'),
  getSelectedCameraConfig: vi
    .fn()
    .mockName('fakeTrackingServiceThrowsErrors.getSelectedCameraConfig'),
  toggleCamera: vi
    .fn()
    .mockName('fakeTrackingServiceThrowsErrors.toggleCamera'),
  setAutostartEnabled: vi
    .fn()
    .mockName('fakeTrackingServiceThrowsErrors.setAutostartEnabled'),
};

const camera0: DepthCamera = {
  id: '0',
  modelDescription: 'ZERO',
  state: DepthCameraState.Disconnected,
  streamParameter: {
    name: 'ZeroCam',
    framerate: 0,
    width: 10,
    height: 5,
  },
};

const camera1: DepthCamera = {
  id: '1',
  modelDescription: 'TestCamera',
  state: DepthCameraState.Streaming,
  streamParameter: {
    name: 'TestConfig',
    framerate: 30,
    width: 100,
    height: 50,
  },
};

const camera2: DepthCamera = {
  id: '2',
  modelDescription: 'AnotherCam',
  state: DepthCameraState.Connected,
  streamParameter: {
    name: 'AnotherConfig',
    framerate: 60,
    width: 640,
    height: 480,
  },
};

const state: TrackingConfigState = {
  isCameraSelected: true,
  selectedCameraName: 'TestCamera',
  selectedConfigurationName: 'TestConfig',
  depthCameraStateName: DepthCameraState[camera1.state],
};

const state2: TrackingConfigState = {
  isCameraSelected: true,
  selectedCameraName: 'ZERO',
  selectedConfigurationName: '',
  depthCameraStateName: DepthCameraState[camera0.state],
};

trackingService.getCameras.mockReturnValue(of([camera0, camera1, camera2]));

trackingService.queryAutostartEnabled.mockReturnValue(of('true'));

trackingService.getStatus.mockReturnValue(of(state));

trackingService.getSelectedCamera.mockReturnValue(of(camera1));

mockReturnValueForArgs(trackingService.getConfigurationsForCamera, [1], of([camera1.streamParameter]));
mockReturnValueForArgs(trackingService.getConfigurationsForCamera, [0], of([camera2.streamParameter, camera0.streamParameter]));

trackingService.getSelectedCameraConfig.mockReturnValue(
  of(camera1.streamParameter)
);

const errorCam = 'TestError: getCameras()';
trackingService_error.getCameras.mockReturnValue(throwError(errorCam));

const errorAutostart = 'TestError: queryAutostartEnabled()';
trackingService_error.queryAutostartEnabled.mockReturnValue(
  throwError(errorAutostart)
);

const errorStatus = 'TestError: getStatus()';
trackingService_error.getStatus.mockReturnValue(throwError(errorStatus));

const errorSelectCam = 'TestError: getSelectedCamera()';
trackingService_error.getSelectedCamera.mockReturnValue(
  throwError(errorSelectCam)
);

const errorConfigCam = 'TestError: getConfigurationsForCamera()';
trackingService_error.getConfigurationsForCamera.mockReturnValue(
  throwError(errorConfigCam)
);

const errorSelectConfig = 'TestError: getSelectedCameraConfig()';
trackingService_error.getSelectedCameraConfig.mockReturnValue(
  throwError(errorSelectConfig)
);

const errorToggle = 'TestError: toggleCamera()';
trackingService_error.toggleCamera.mockReturnValue(throwError(errorToggle));

const errorSaveAutoStart = 'TestError: setAutostartEnabled()';
trackingService_error.setAutostartEnabled.mockReturnValue(
  throwError(errorSaveAutoStart)
);

const settingsService = {
  getSettings: vi.fn().mockName('fakeSettingsService.getSettings'),
  getCanRestore: vi.fn().mockName('fakeSettingsService.getCanRestore'),
  update: vi.fn().mockName('fakeSettingsService.update'),
};
const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog'),
};

settingsService.getSettings.mockReturnValue(of(DEFAULT_SETTINGS));
settingsService.getCanRestore.mockReturnValue(
  of({ name: 'canRestore', value: true })
);

describe('TrackingComponent', () => {
  let component: TrackingComponent;
  let fixture: ComponentFixture<TrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, TrackingComponent],
      providers: [
        { provide: BASE_URL, useValue: '', deps: [] },
        {
          provide: TrackingService,
          useValue: trackingService,
        },
        {
          provide: SettingsService,
          useValue: settingsService,
        },
        {
          provide: LogService,
          useValue: logService,
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(TrackingComponent, {
        remove: {
          imports: [
            PanelHeaderComponent,
            RecordingComponent,
            SettingsComponent,
            PointCloudComponent,
            DepthImageComponent,
          ],
        },
        add: {
          imports: [
            MockPanelHeaderComponent,
            MockRecordingComponent,
            MockSettingsComponent,
            MockPointCloudComponent,
            MockDepthImageComponent,
          ],
        },
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackingComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();

    trackingService.getStatus.mockClear();
    trackingService.getCameras.mockClear();
    trackingService.queryAutostartEnabled.mockClear();
    trackingService.getSelectedCamera.mockClear();
    trackingService.getConfigurationsForCamera.mockClear();
    trackingService.getSelectedCameraConfig.mockClear();
    trackingService.toggleCamera.mockClear();
    trackingService.setAutostartEnabled.mockClear();

    settingsService.update.mockClear();

    logService.sendErrorLog.mockClear();
  });

  afterAll(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

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

  it('should update selected camera and config correctly', async () => {
    // now execute OnInit()
    fixture.detectChanges();
    await fixture.whenStable();

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
    await fixture.whenStable();

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

  it('should unsubscribe completely onDestroy', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.ngOnDestroy();

    expect(component['statusSubscription']?.closed).toBeTruthy();
    expect(component['autostartSubscription']?.closed).toBeTruthy();
    expect(component['selectedCamSubscription']?.closed).toBeTruthy();
    expect(
      component['configSubscription'] === undefined ||
        component['configSubscription'].closed
    ).toBe(true);
    expect(
      component['selectedCamConfigSubscription'] === undefined ||
        component['selectedCamConfigSubscription'].closed
    ).toBe(true);
    expect(
      component['cameraSubscription'] === undefined ||
        component['cameraSubscription'].closed
    ).toBe(true);
  });
});

describe('TrackingComponent: Test Service throwing Errors', () => {
  let component: TrackingComponent;
  let fixture: ComponentFixture<TrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, CommonModule, TrackingComponent],
      providers: [
        {
          provide: TrackingService,
          useValue: trackingService_error,
        },
        {
          provide: SettingsService,
          useValue: settingsService,
        },
        {
          provide: LogService,
          useValue: logService,
        },
        {
          provide: BASE_URL,
          useValue: 'http://localhost',
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(TrackingComponent, {
        remove: {
          imports: [
            PanelHeaderComponent,
            ValueSelectionComponent,
            RecordingComponent,
            SettingsComponent,
            PointCloudComponent,
            DepthImageComponent,
          ],
        },
        add: {
          imports: [
            MockPanelHeaderComponent,
            MockValueSelectionComponent,
            MockRecordingComponent,
            MockSettingsComponent,
            MockPointCloudComponent,
            MockDepthImageComponent,
          ],
        },
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackingComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();

    trackingService_error.getStatus.mockClear();
    trackingService_error.getCameras.mockClear();
    trackingService_error.queryAutostartEnabled.mockClear();
    trackingService_error.getSelectedCamera.mockClear();
    trackingService_error.getConfigurationsForCamera.mockClear();
    trackingService_error.getSelectedCameraConfig.mockClear();
    trackingService_error.toggleCamera.mockClear();
    trackingService_error.setAutostartEnabled.mockClear();

    settingsService.update.mockClear();

    logService.sendErrorLog.mockClear();
  });

  afterAll(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should handle errors correctly', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    // handle errors when initializing

    expect(trackingService_error.getCameras).toHaveBeenCalledTimes(1);
    expect(trackingService_error.queryAutostartEnabled).toHaveBeenCalledTimes(
      1
    );
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

    expect(
      trackingService_error.getConfigurationsForCamera
    ).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(5);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorConfigCam);

    component.start();

    expect(trackingService_error.toggleCamera).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(6);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorToggle);

    component.saveAutoStart();

    expect(trackingService_error.setAutostartEnabled).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(7);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSaveAutoStart);

    fixture.destroy();
    TestBed.resetTestingModule();
  });
});
