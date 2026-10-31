import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { LogService } from '../log/log.service';
import { MockMeasureControlsComponent } from './measure-controls/measure-control.component.mock';
import { MeasureControlsComponent } from './measure-controls/measure-controls.component';
import { MeasureGridComponent } from './measure-grid/measure-grid.component';
import { MockMeasureGridComponent } from './measure-grid/measure-grid.component.mock';
import { MeasureSurfaceComponent } from './measure-surface.component';
import { calibrationService, customFrame, logService } from './measure-surface.component.test-data';

export let component: MeasureSurfaceComponent;

export let fixture: ComponentFixture<MeasureSurfaceComponent>;

export function setupTests(): void {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MeasureSurfaceComponent,
        MockMeasureControlsComponent,
        MeasureGridComponent
      ],
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
      .overrideComponent(MeasureSurfaceComponent, {
        remove: { imports: [MeasureControlsComponent, MeasureGridComponent] },
        add: {
          imports: [MockMeasureControlsComponent, MockMeasureGridComponent]
        }
      })
      .compileComponents();
  });

  beforeEach(() => {
    calibrationService.getFrameSize.mockReturnValue(of(customFrame));
    logService.sendErrorLog.mockReturnValue(undefined);

    fixture = TestBed.createComponent(MeasureSurfaceComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    calibrationService.getFrameSize.mockClear();
    logService.sendErrorLog.mockClear();
  });
}
