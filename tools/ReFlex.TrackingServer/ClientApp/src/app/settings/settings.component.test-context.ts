import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MockOptionCheckboxComponent,
  MockSettingsGroupComponent,
  MockValueSelectionComponent,
  MockValueSliderComponent,
  OptionCheckboxComponent,
  SettingsGroupComponent,
  ValueSelectionComponent,
  ValueSliderComponent
} from '@reflex/angular-components/dist';
import {
  DEFAULT_SETTINGS
} from '@reflex/shared-types';
import { of } from 'rxjs';
import { PerformanceService } from 'src/shared/services/performance.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { TrackingService } from 'src/shared/services/tracking.service';
import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { LogService } from '../log/log.service';
import { SettingsComponent } from './settings.component';
import { logService, perfData, performanceService, settingsService, state, trackingService } from './settings.component.test-data';

export let component: SettingsComponent;

export let fixture: ComponentFixture<SettingsComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, SettingsComponent],
      providers: [
        {
          provide: TrackingService,
          useValue: trackingService
        },
        {
          provide: PerformanceService,
          useValue: performanceService
        },
        {
          provide: SettingsService,
          useValue: settingsService
        },
        {
          provide: LogService,
          useValue: logService
        },
        {
          provide: BASE_URL,
          useValue: 'http://localhost'
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .overrideComponent(SettingsComponent, {
        remove: {
          imports: [
            ValueSliderComponent,
            OptionCheckboxComponent,
            SettingsGroupComponent,
            ValueSelectionComponent
          ]
        },
        add: {
          imports: [
            MockValueSliderComponent,
            MockOptionCheckboxComponent,
            MockSettingsGroupComponent,
            MockValueSelectionComponent
          ]
        }
      })
      .compileComponents();
  });

  beforeEach(() => {
    logService.sendErrorLog.mockReturnValue(undefined);

    settingsService.getSettings.mockReturnValue(of(DEFAULT_SETTINGS));
    settingsService.getCanRestore.mockReturnValue(
      of({ name: 'canRestore', value: true })
    );

    trackingService.getStatus.mockReturnValue(of(state));

    performanceService.getData.mockReturnValue(of(perfData));

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    logService.sendErrorLog.mockClear();

    settingsService.getSettings.mockClear();
    settingsService.getCanRestore.mockClear();

    trackingService.getStatus.mockClear();

    performanceService.getData.mockClear();
  });
}
