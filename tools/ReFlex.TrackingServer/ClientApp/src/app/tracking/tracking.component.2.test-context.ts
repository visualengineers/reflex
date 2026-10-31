import { CommonModule } from '@angular/common';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MockPanelHeaderComponent,
  MockValueSelectionComponent,
  PanelHeaderComponent,
  ValueSelectionComponent
} from '@reflex/angular-components/dist';
import { SettingsService } from 'src/shared/services/settingsService';
import { TrackingService } from 'src/shared/services/tracking.service';
import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { LogService } from '../log/log.service';
import { SettingsComponent } from '../settings/settings.component';
import { MockSettingsComponent } from '../settings/settings.component.mock';
import { DepthImageComponent } from './depth-image/depth-image.component';
import { MockDepthImageComponent } from './depth-image/depth-image.component.mock';
import { PointCloudComponent } from './point-cloud/point-cloud.component';
import { MockPointCloudComponent } from './point-cloud/point-cloud.component.mock';
import { RecordingComponent } from './recording/recording.component';
import { MockRecordingComponent } from './recording/recording.component.mock';
import { TrackingComponent } from './tracking.component';
import { logService, settingsService, trackingServiceError } from './tracking.component.test-data';

export let component: TrackingComponent;

export let fixture: ComponentFixture<TrackingComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, CommonModule, TrackingComponent],
      providers: [
        {
          provide: TrackingService,
          useValue: trackingServiceError
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
      .overrideComponent(TrackingComponent, {
        remove: {
          imports: [
            PanelHeaderComponent,
            ValueSelectionComponent,
            RecordingComponent,
            SettingsComponent,
            PointCloudComponent,
            DepthImageComponent
          ]
        },
        add: {
          imports: [
            MockPanelHeaderComponent,
            MockValueSelectionComponent,
            MockRecordingComponent,
            MockSettingsComponent,
            MockPointCloudComponent,
            MockDepthImageComponent
          ]
        }
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

    trackingServiceError.getStatus.mockClear();
    trackingServiceError.getCameras.mockClear();
    trackingServiceError.queryAutostartEnabled.mockClear();
    trackingServiceError.getSelectedCamera.mockClear();
    trackingServiceError.getConfigurationsForCamera.mockClear();
    trackingServiceError.getSelectedCameraConfig.mockClear();
    trackingServiceError.toggleCamera.mockClear();
    trackingServiceError.setAutostartEnabled.mockClear();

    settingsService.update.mockClear();

    logService.sendErrorLog.mockClear();
  });

  afterAll(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });
}
