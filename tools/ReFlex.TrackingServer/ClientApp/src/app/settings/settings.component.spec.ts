import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsComponent } from './settings.component';
import { LogService } from '../log/log.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { TrackingService } from 'src/shared/services/tracking.service';
import { PerformanceService } from 'src/shared/services/performance.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, Subject } from 'rxjs';
import {
  DEFAULT_SETTINGS,
  DepthCameraState,
  PerformanceData,
  TrackingConfigState,
} from '@reflex/shared-types';
import {
  MockOptionCheckboxComponent,
  MockSettingsGroupComponent,
  MockValueSelectionComponent,
  MockValueSliderComponent,
  OptionCheckboxComponent,
  SettingsGroupComponent,
  ValueSelectionComponent,
  ValueSliderComponent,
} from '@reflex/angular-components/dist';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';

const logService = jasmine.createSpyObj<LogService>('fakeLogService', [
  'sendErrorLog',
]);

const settingsService = jasmine.createSpyObj<SettingsService>(
  'fakeSettingsService',
  ['getSettings', 'getCanRestore', 'update']
);

const trackingService = jasmine.createSpyObj<TrackingService>(
  'fakeTrackingService',
  ['getStatus']
);

const performanceService = jasmine.createSpyObj<PerformanceService>(
  'fakePerformanceService',
  ['getData']
);

const state: TrackingConfigState = {
  isCameraSelected: true,
  selectedCameraName: 'TestCamera',
  selectedConfigurationName: 'TestConfig',
  depthCameraStateName: DepthCameraState[DepthCameraState.Streaming],
};

const perfData: PerformanceData = {
  data: [],
};

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, SettingsComponent],
      providers: [
        {
          provide: TrackingService,
          useValue: trackingService,
        },
        {
          provide: PerformanceService,
          useValue: performanceService,
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
      .overrideComponent(SettingsComponent, {
        remove: {
          imports: [
            ValueSliderComponent,
            OptionCheckboxComponent,
            SettingsGroupComponent,
            ValueSelectionComponent,
          ],
        },
        add: {
          imports: [
            MockValueSliderComponent,
            MockOptionCheckboxComponent,
            MockSettingsGroupComponent,
            MockValueSelectionComponent,
          ],
        },
      })
      .compileComponents();
  });

  beforeEach(() => {
    logService.sendErrorLog.and.returnValue();

    settingsService.getSettings.and.returnValue(of(DEFAULT_SETTINGS));
    settingsService.getCanRestore.and.returnValue(
      of({ name: 'canRestore', value: true })
    );

    trackingService.getStatus.and.returnValue(of(state));

    performanceService.getData.and.returnValue(of(perfData));

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    logService.sendErrorLog.calls.reset();

    settingsService.getSettings.calls.reset();
    settingsService.getCanRestore.calls.reset();

    trackingService.getStatus.calls.reset();

    performanceService.getData.calls.reset();
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
  it('combines partial performance frames and updates existing chart entries', async () => {
    const updates = new Subject<PerformanceData>();
    performanceService.getData.and.returnValue(updates);
    await fixture.whenStable();
    updates.next({data: [{frameId: 1, frameStart: 1000, frameEnd: 5000,
      totalFrameTime: 0, boxFilter: 2, valueFilter: 3}]});
    await fixture.whenStable();
    expect(component.performanceDataFilterVis[0].totalFilter).toBe(5);

    updates.next({data: [{frameId: 1, frameStart: 2000, frameEnd: 6000,
      totalFrameTime: 0, processingPreparation: 4, processingConvert: 5}]});
    await fixture.whenStable();
    expect(component.performanceDataProcessingVis[0].totalProcessing).toBe(9);
    expect(component.performanceDataCompleteTimeFrameVis[0].totalFrameTime).toBe(5);

    updates.next({data: [{frameId: 1, frameStart: 0, frameEnd: 4000,
      totalFrameTime: 0, boxFilter: 7}]});
    await fixture.whenStable();
    expect(component.performanceDataFilterVis.length).toBe(1);
    expect(component.performanceDataFilterVis[0].totalFilter).toBe(7);
    expect(component.performanceDataProcessingVis.length).toBe(1);
    expect(component.performanceDataCompleteTimeFrameVis.length).toBe(1);
    expect(component.performanceDataCompleteTimeFrameVis[0].frameStart).toBe(0);
    expect(component.performanceDataCompleteTimeFrameVis[0].frameEnd).toBe(5000);
    expect(component.performanceDataCompleteTimeFrameVis[0].totalFrameTime).toBe(5);
  });

});
