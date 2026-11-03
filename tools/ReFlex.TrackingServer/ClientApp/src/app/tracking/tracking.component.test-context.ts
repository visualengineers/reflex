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
  PanelHeaderComponent
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
import { logService, settingsService, trackingService, trackingServiceError } from './tracking.component.test-data';

export let component: TrackingComponent;

export let fixture: ComponentFixture<TrackingComponent>;

// Error suites exercise the same component setup with failing service responses.
export function setupTests(mode: 'success' | 'error' = 'success'): void {
  const serviceMock = mode === 'error' ? trackingServiceError : trackingService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, TrackingComponent],
      providers: [
        { provide: BASE_URL, useValue: 'http://localhost/' },
        {
          provide: TrackingService,
          useValue: serviceMock
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
      .overrideComponent(TrackingComponent, {
        remove: {
          imports: [
            PanelHeaderComponent,
            RecordingComponent,
            SettingsComponent,
            PointCloudComponent,
            DepthImageComponent
          ]
        },
        add: {
          imports: [
            MockPanelHeaderComponent,
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

    serviceMock.getStatus.mockClear();
    serviceMock.getCameras.mockClear();
    serviceMock.queryAutostartEnabled.mockClear();
    serviceMock.getSelectedCamera.mockClear();
    serviceMock.getConfigurationsForCamera.mockClear();
    serviceMock.getSelectedCameraConfig.mockClear();
    serviceMock.toggleCamera.mockClear();
    serviceMock.setAutostartEnabled.mockClear();

    settingsService.update.mockClear();

    logService.sendErrorLog.mockClear();
  });

}
