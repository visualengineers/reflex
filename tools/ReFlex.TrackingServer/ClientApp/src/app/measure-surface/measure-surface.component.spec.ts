import { BASE_URL } from 'src/shared/tokens/base-url.token';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MeasureSurfaceComponent } from './measure-surface.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { LogService } from '../log/log.service';
import { of, throwError } from 'rxjs';
import { MockMeasureControlsComponent } from './measure-controls/measure-control.component.mock';
import { MeasureGridComponent } from './measure-grid/measure-grid.component';
import { FrameSizeDefinition } from '@reflex/shared-types';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import { MeasureControlsComponent } from './measure-controls/measure-controls.component';
import { MockMeasureGridComponent } from './measure-grid/measure-grid.component.mock';

const calibrationService = {
  getFrameSize: vi.fn().mockName('fakeCalibrationService.getFrameSize'),
};

const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog'),
};

const customFrame: FrameSizeDefinition = {
  width: 500,
  height: 400,
  left: 150,
  top: 75,
};

describe('MeasureSurfaceComponent', () => {
  let component: MeasureSurfaceComponent;
  let fixture: ComponentFixture<MeasureSurfaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MeasureSurfaceComponent,
        MockMeasureControlsComponent,
        MeasureGridComponent,
      ],
      providers: [
        {
          provide: CalibrationService,
          useValue: calibrationService,
        },
        {
          provide: LogService,
          useValue: logService,
        },
        {
          provide: BASE_URL,
          useValue: 'http://localhost',
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(MeasureSurfaceComponent, {
        remove: { imports: [MeasureControlsComponent, MeasureGridComponent] },
        add: {
          imports: [MockMeasureControlsComponent, MockMeasureGridComponent],
        },
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

  it('should create and initialize values correctly', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(component['frameSize']).toEqual(customFrame);
    expect(component.fullScreen).toBe(false);
  });

  it('should handle errors correctly', () => {
    const errorFrameSize = 'Test Error: calibrationService.getFrameSize';
    calibrationService.getFrameSize.mockReturnValue(throwError(errorFrameSize));

    fixture.detectChanges();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorFrameSize);
  });

  it('should correctly apply style', () => {
    fixture.detectChanges();

    expect(component.fullScreen).toBe(false);

    const expected1 = {
      position: 'relative',
      top: '0',
      left: '0',
      width: '100%',
      height: '40vh',
    };
    const expected2 = {
      position: 'absolute',
      top: `${customFrame.top}px`,
      left: `${customFrame.left}px`,
      width: `${customFrame.width}px`,
      height: `${customFrame.height}px`,
    };

    let style1 = component.getViewStyle();

    expect(style1).toEqual(expected1);

    component.fullScreen = true;

    let style2 = component.getViewStyle();

    expect(style2).toEqual(expected2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});
