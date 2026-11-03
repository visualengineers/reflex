import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
  MockValueTextComponent,
  ValueTextComponent
} from '@reflex/angular-components/dist';
import { LogService } from 'src/app/log/log.service';
import { RecordingService } from 'src/shared/services/recording.service';
import { RecordingComponent } from './recording.component';
import { logService, recordingService, recordingServiceError, recordingStateUpdates, stoppedRecordingState } from './recording.component.test-data';

export let component: RecordingComponent;

export let fixture: ComponentFixture<RecordingComponent>;

// Error suites exercise the same component setup with failing service responses.
export function setupTests(mode: 'success' | 'error' = 'success'): void {
  const serviceMock = mode === 'error' ? recordingServiceError : recordingService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, RecordingComponent],
      providers: [
        {
          provide: RecordingService,
          useValue: serviceMock
        },
        {
          provide: LogService,
          useValue: logService
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .overrideComponent(RecordingComponent, {
        remove: { imports: [ValueTextComponent] },
        add: { imports: [MockValueTextComponent] }
      })
      .compileComponents();
  });

  beforeEach(() => {
    serviceMock.usePng = false;
    recordingStateUpdates.next(stoppedRecordingState);
    fixture = TestBed.createComponent(RecordingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    serviceMock.getStatus.mockClear();
    serviceMock.getRecordings.mockClear();
    serviceMock.getRecordingState.mockClear();
    serviceMock.startRecording.mockClear();
    serviceMock.stopRecording.mockClear();
    serviceMock.deleteRecording.mockClear();
    serviceMock.clearRecordings.mockClear();

    logService.sendErrorLog.mockClear();
  });
}
