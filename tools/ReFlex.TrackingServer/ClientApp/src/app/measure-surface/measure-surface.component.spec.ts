import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MeasureSurfaceComponent } from './measure-surface.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { LogService } from '../log/log.service';
import { of, throwError } from 'rxjs';
import { MockMeasureControlsComponent } from './measure-controls/measure-control.component.mock';
import { MeasureGridComponent } from './measure-grid/measure-grid.component';
import { FrameSizeDefinition } from '@reflex/shared-types';

const calibrationService = jasmine.createSpyObj<CalibrationService>('fakeCalibrationService', 
  [
    'getFrameSize'
  ]
);

const logService = jasmine.createSpyObj<LogService>('fakeLogService', 
  [
    'sendErrorLog'
  ]);

const customFrame: FrameSizeDefinition = 
  { width: 500, height: 400, left: 150, top: 75 };

describe('MeasureSurfaceComponent', () => {
  let component: MeasureSurfaceComponent;
  let fixture: ComponentFixture<MeasureSurfaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MeasureSurfaceComponent, MockMeasureControlsComponent, MeasureGridComponent ],
      imports: [
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: CalibrationService, useValue: calibrationService
        },
        {
          provide: LogService, useValue: logService
        }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    calibrationService.getFrameSize.and.returnValue(of(customFrame));
    logService.sendErrorLog.and.returnValue();

    fixture = TestBed.createComponent(MeasureSurfaceComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    calibrationService.getFrameSize.calls.reset();
    logService.sendErrorLog.calls.reset();
  });


  it('should create and initialize values correctly', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(component['frameSize']).toEqual(customFrame);
    expect(component.fullScreen).toBeFalse();
  });

  it('should handle errors correctly', () => {
    const errorFrameSize = 'Test Error: calibrationService.getFrameSize';
    calibrationService.getFrameSize.and.returnValue(throwError(errorFrameSize));

    fixture.detectChanges();

    expect(logService.sendErrorLog).toHaveBeenCalledOnceWith(errorFrameSize);
  });

  it('should correctly apply style', () => {
    fixture.detectChanges();

    expect(component.fullScreen).toBeFalse();

    const expected1 = { position: 'relative', top: '0', left: '0', width: '100%', height: '40vh' };
    const expected2 = { position: 'absolute', top:  `${customFrame.top}px`, left: `${customFrame.left}px`, width: `${customFrame.width}px`, height: `${customFrame.height}px` };

    let style1 = component.getViewStyle();

    expect(style1).toEqual(expected1);

    component.fullScreen = true;

    let style2 = component.getViewStyle();

    expect(style2).toEqual(expected2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});
