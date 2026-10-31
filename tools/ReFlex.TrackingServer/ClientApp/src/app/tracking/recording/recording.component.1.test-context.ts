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
import { logService, recordingService } from './recording.component.test-data';

export let component: RecordingComponent;

export let fixture: ComponentFixture<RecordingComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, RecordingComponent],
      providers: [
        {
          provide: RecordingService,
          useValue: recordingService
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
    fixture = TestBed.createComponent(RecordingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    recordingService.getStatus.mockClear();
    recordingService.getRecordings.mockClear();
    recordingService.getRecordingState.mockClear();
    recordingService.startRecording.mockClear();
    recordingService.stopRecording.mockClear();
    recordingService.deleteRecording.mockClear();
    recordingService.clearRecordings.mockClear();

    logService.sendErrorLog.mockClear();
  });
}
