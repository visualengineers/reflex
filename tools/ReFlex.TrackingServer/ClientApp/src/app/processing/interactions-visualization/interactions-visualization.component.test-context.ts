import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { LogService } from 'src/app/log/log.service';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { HistoryVisualizationComponent } from '../history-visualization/history-visualization.component';
import { MockHistoryVisualizationComponent } from '../history-visualization/history-visualization.component.mock';
import { InteractionsVisualizationComponent } from './interactions-visualization.component';
import { calibrationService, customFrame, logService } from './interactions-visualization.component.test-data';

export let component: InteractionsVisualizationComponent;

export let fixture: ComponentFixture<InteractionsVisualizationComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, InteractionsVisualizationComponent],
      providers: [
        {
          provide: CalibrationService,
          useValue: calibrationService
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
      .overrideComponent(InteractionsVisualizationComponent, {
        remove: { imports: [HistoryVisualizationComponent] },
        add: { imports: [MockHistoryVisualizationComponent] }
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractionsVisualizationComponent);
    component = fixture.componentInstance;
    logService.sendErrorLog.mockReturnValue(undefined);
    calibrationService.getFrameSize.mockReturnValue(of(customFrame));
  });

  afterEach(() => {
    calibrationService.getFrameSize.mockClear();
    logService.sendErrorLog.mockClear();
  });
}
