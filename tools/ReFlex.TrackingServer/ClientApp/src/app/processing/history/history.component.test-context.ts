import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LogService } from 'src/app/log/log.service';
import { ProcessingService } from 'src/shared/services/processing.service';
import { HistoryComponent } from './history.component';
import { frames, history, logService, processingService } from './history.component.test-data';

export let component: HistoryComponent;

export let fixture: ComponentFixture<HistoryComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        {
          provide: ProcessingService,
          useValue: processingService
        },
        {
          provide: LogService,
          useValue: logService
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;

    logService.sendErrorLog.mockReturnValue(undefined);
    processingService.getFrames.mockReturnValue(of(frames));
    processingService.getHistory.mockReturnValue(of(history));
    processingService.getStatus.mockReturnValue(of('Active'));
  });

  afterEach(() => {
    processingService.getFrames.mockClear();
    processingService.getHistory.mockClear();
    logService.sendErrorLog.mockClear();

    component.frames = [];
    component.history = [];
  });
}
