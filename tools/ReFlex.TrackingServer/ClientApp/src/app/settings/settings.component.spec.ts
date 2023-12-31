import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SettingsComponent } from './settings.component';
import { LogService } from '../log/log.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { TrackingService } from 'src/shared/services/tracking.service';
import { PerformanceService } from 'src/shared/services/performance.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { MockValueSliderComponent } from '../elements/value-slider/value-slider.mock';
import { MockOptionCheckboxComponent } from '../elements/option-checkbox/option-checkbox.component.mock';
import { MockSettingsGroupComponent } from '../elements/settings-group/settings-group.component.mock';
import { MockValueSelectionComponent } from '../elements/value-selection/value-selection.component.mock';
import { DEFAULT_SETTINGS, DepthCameraState, PerformanceData, TrackingConfigState } from '@reflex/shared-types';

const logService = jasmine.createSpyObj<LogService>('fakeLogService', 
  [
    'sendErrorLog'
  ]);

const settingsService = jasmine.createSpyObj<SettingsService>('fakeSettingsService', 
  [
    'getSettings',
    'getCanRestore',
    'update'
  ]);

const trackingService = jasmine.createSpyObj<TrackingService>('fakeTrackingService', 
  [
    'getStatus'
  ]);

const performanceService = jasmine.createSpyObj<PerformanceService>('fakePerformanceService',
  [
    'getData'
  ]);

const state: TrackingConfigState = {
  isCameraSelected: true, 
  selectedCameraName: 'TestCamera', 
  selectedConfigurationName: 'TestConfig', 
  depthCameraStateName: DepthCameraState[DepthCameraState.Streaming]
};

const perfData: PerformanceData = {
  data: []
}

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ 
        SettingsComponent,
        MockValueSliderComponent,
        MockOptionCheckboxComponent,
        MockSettingsGroupComponent,
        MockValueSelectionComponent 
      ],
      imports: [
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: TrackingService, useValue: trackingService
        },
        {
          provide: PerformanceService, useValue: performanceService
        },
        {
          provide: SettingsService, useValue: settingsService
        },
        {
          provide: LogService, useValue: logService
        },
        {
          provide: 'BASE_URL', useValue: 'http://localhost'
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    logService.sendErrorLog.and.returnValue();

    settingsService.getSettings.and.returnValue(of(DEFAULT_SETTINGS));
    settingsService.getCanRestore.and.returnValue(of({name: 'canRestore', value: true }));

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
});
