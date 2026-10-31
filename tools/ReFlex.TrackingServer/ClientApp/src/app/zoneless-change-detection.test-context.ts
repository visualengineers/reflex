import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { MeasureService } from 'src/shared/services/measure.service';
import { NetworkingService } from 'src/shared/services/networking.service';
import { PerformanceService } from 'src/shared/services/performance.service';
import { PointCloudService } from 'src/shared/services/point-cloud.service';
import { ProcessingService } from 'src/shared/services/processing.service';
import { RecordingService } from 'src/shared/services/recording.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { TrackingService } from 'src/shared/services/tracking.service';
import { TuioService } from 'src/shared/services/tuio.service';
import { VersionInfoService } from 'src/shared/services/version.service';
import { WebSocketService } from 'src/shared/services/webSocket.service';
import { BASE_URL } from 'src/shared/tokens/base-url.token';
import type { MockedObject } from 'vitest';
import { LogService } from './log/log.service';
import { SettingsComponent } from './settings/settings.component';
import { MockSettingsComponent } from './settings/settings.component.mock';
import { DepthImageComponent } from './tracking/depth-image/depth-image.component';
import { MockDepthImageComponent } from './tracking/depth-image/depth-image.component.mock';
import { PointCloudComponent } from './tracking/point-cloud/point-cloud.component';
import { MockPointCloudComponent } from './tracking/point-cloud/point-cloud.component.mock';
import { RecordingComponent } from './tracking/recording/recording.component';
import { MockRecordingComponent } from './tracking/recording/recording.component.mock';
import { TrackingComponent } from './tracking/tracking.component';
import { mockService } from './zoneless-change-detection.test-data';

export let settings: MockedObject<SettingsService>;

export let tracking: MockedObject<TrackingService>;

export let processing: MockedObject<ProcessingService>;

export let calibration: MockedObject<CalibrationService>;

export let network: MockedObject<NetworkingService>;

export let tuio: MockedObject<TuioService>;

export let performance: MockedObject<PerformanceService>;

export let recording: MockedObject<RecordingService>;

export let measure: MockedObject<MeasureService>;

export let log: MockedObject<LogService>;

export let version: MockedObject<VersionInfoService>;

export let websocket: MockedObject<WebSocketService>;

export let pointCloud: MockedObject<PointCloudService>;

export async function mount<T>(type: Type<T>): Promise<ComponentFixture<T>> {
  TestBed.configureTestingModule({ imports: [type] });
  const fixture = TestBed.createComponent(type);
  for (const request of TestBed.inject(HttpTestingController).match((req) =>
    req.url.startsWith('assets/shader/'))) {
    request.flush('');
  }
  await fixture.whenStable();

  return fixture;
}

export const text = <T>(fixture: ComponentFixture<T>): string =>
  (fixture.nativeElement as HTMLElement).textContent ?? '';

export function isolateTracking(): void {
  TestBed.overrideComponent(TrackingComponent, {
    remove: {
      imports: [
        SettingsComponent,
        DepthImageComponent,
        PointCloudComponent,
        RecordingComponent
      ]
    },
    add: {
      imports: [
        MockSettingsComponent,
        MockDepthImageComponent,
        MockPointCloudComponent,
        MockRecordingComponent
      ]
    }
  });
}

export function setupTests(): void {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: BASE_URL, useValue: 'http://localhost/' }
      ]
    });
    settings = mockService(SettingsService);
    tracking = mockService(TrackingService);
    processing = mockService(ProcessingService);
    calibration = mockService(CalibrationService);
    network = mockService(NetworkingService);
    tuio = mockService(TuioService);
    performance = mockService(PerformanceService);
    recording = mockService(RecordingService);
    measure = mockService(MeasureService);
    log = mockService(LogService);
    version = mockService(VersionInfoService);
    websocket = mockService(WebSocketService);
    pointCloud = mockService(PointCloudService);
  });
}
