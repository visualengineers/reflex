import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  ValueTextComponent
} from '@reflex/angular-components/dist';
import { LogService } from 'src/app/log/log.service';
import { RecordingService } from 'src/shared/services/recording.service';
import { RecordingComponent } from './recording.component';
import { logService, recordingServiceError } from './recording.component.test-data';

export let component: RecordingComponent;

export let fixture: ComponentFixture<RecordingComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, ValueTextComponent, RecordingComponent],
      providers: [
        {
          provide: RecordingService,
          useValue: recordingServiceError
        },
        {
          provide: LogService,
          useValue: logService
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    recordingServiceError.getStatus.mockClear();
    recordingServiceError.getRecordings.mockClear();
    recordingServiceError.getRecordingState.mockClear();
    recordingServiceError.startRecording.mockClear();
    recordingServiceError.stopRecording.mockClear();
    recordingServiceError.deleteRecording.mockClear();
    recordingServiceError.clearRecordings.mockClear();

    logService.sendErrorLog.mockClear();
  });
}
