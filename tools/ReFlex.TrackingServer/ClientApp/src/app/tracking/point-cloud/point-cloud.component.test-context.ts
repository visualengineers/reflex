export let httpTestingController: HttpTestingController;
export let httpClient: HttpClient;
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MockOptionCheckboxComponent,
  MockPanelHeaderComponent,
  MockSettingsGroupComponent,
  MockValueSliderComponent,
  OptionCheckboxComponent,
  PanelHeaderComponent,
  SettingsGroupComponent,
  ValueSliderComponent
} from '@reflex/angular-components/dist';
import {
  DEFAULT_SETTINGS
} from '@reflex/shared-types';
import { of } from 'rxjs';
import { LogService } from 'src/app/log/log.service';
import { PointCloudService } from 'src/shared/services/point-cloud.service';
import { ProcessingService } from 'src/shared/services/processing.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { TrackingService } from 'src/shared/services/tracking.service';
import { PointCloudComponent } from './point-cloud.component';
import { logService, pointCloudService, processingService, settingsService, state, trackingService } from './point-cloud.component.test-data';

export let component: PointCloudComponent;

export let fixture: ComponentFixture<PointCloudComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, PointCloudComponent],
      providers: [
        {
          provide: TrackingService,
          useValue: trackingService
        },
        {
          provide: PointCloudService,
          useValue: pointCloudService
        },
        {
          provide: ProcessingService,
          useValue: processingService
        },
        {
          provide: SettingsService,
          useValue: settingsService
        },
        {
          provide: LogService,
          useValue: logService
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .overrideComponent(PointCloudComponent, {
        remove: {
          imports: [
            PanelHeaderComponent,
            ValueSliderComponent,
            OptionCheckboxComponent,
            SettingsGroupComponent
          ]
        },
        add: {
          imports: [
            MockPanelHeaderComponent,
            MockValueSliderComponent,
            MockOptionCheckboxComponent,
            MockSettingsGroupComponent
          ]
        }
      })

      .compileComponents();
  });

  beforeEach(() => {
    // These tests exercise geometry and service state, not native GPU rendering.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(PointCloudComponent);
    component = fixture.componentInstance;

    // reset services
    pointCloudService.getPointCloud.mockReturnValue(of([]));
    processingService.getInteractions.mockReturnValue(of([]));

    trackingService.getStatus.mockReturnValue(of(state));
    settingsService.getSettings.mockReturnValue(of(DEFAULT_SETTINGS));

    logService.sendErrorLog.mockReturnValue(undefined);
  });

  afterEach(() => {
    pointCloudService.getPointCloud.mockClear();
    processingService.getInteractions.mockClear();
    trackingService.getStatus.mockClear();
    settingsService.getSettings.mockClear();
    logService.sendErrorLog.mockClear();
  });
}
