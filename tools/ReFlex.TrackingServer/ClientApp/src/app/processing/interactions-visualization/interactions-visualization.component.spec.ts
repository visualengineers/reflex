import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractionsVisualizationComponent } from './interactions-visualization.component';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { LogService } from 'src/app/log/log.service';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MockHistoryVisualizationComponent } from '../history-visualization/history-visualization.component.mock';
import { CompleteInteractionData, FrameSizeDefinition } from '@reflex/shared-types';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HistoryVisualizationComponent } from '../history-visualization/history-visualization.component';

const calibrationService = jasmine.createSpyObj<CalibrationService>('fakeCalibrationService',
  [
    'getFrameSize'
  ]
);

const logService = jasmine.createSpyObj<LogService>('fakeLogService',
  [
    'sendErrorLog'
  ]
);

const customFrame: FrameSizeDefinition =
  { width: 500, height: 400, left: 150, top: 75 };

const testInteractionData: CompleteInteractionData = {
  raw: [
    { touchId: 0, confidence: 10, time: 1234567, type: 0,
      extremumDescription: { type: 0, numFittingPoints:10, percentageFittingPoints: 100 },
      position: { x: 100, y: 150, z: 30, isFiltered: false, isValid: true }
    },
    { touchId: 1, confidence: 5, time: 13343434242, type: 1,
      extremumDescription: { type: 1, numFittingPoints:5, percentageFittingPoints: 90 },
      position: { x: 200, y: 50, z: -30, isFiltered: false, isValid: true }
    },
    { touchId: 2, confidence: 15, time: 54654646, type: 2,
      extremumDescription: { type: 2, numFittingPoints:1, percentageFittingPoints: 10 },
      position: { x: 300, y: 450, z: 0, isFiltered: false, isValid: true }
    }
  ],
  normalized: [
    { touchId: 0, confidence: 10, time: 1234567, type: 0,
      extremumDescription: { type: 0, numFittingPoints:10, percentageFittingPoints: 100 },
      position: { x: 0.1, y: 0.15, z: 0.3, isFiltered: false, isValid: true }
    },
    { touchId: 1, confidence: 5, time: 13343434242, type: 1,
      extremumDescription: { type: 1, numFittingPoints:5, percentageFittingPoints: 90 },
      position: { x: 0.2, y: 0.05, z: -0.3, isFiltered: false, isValid: true }
    },
    { touchId: 2, confidence: 15, time: 54654646, type: 2,
      extremumDescription: { type: 2, numFittingPoints:1, percentageFittingPoints: 10 },
      position: { x: 0.3, y: 0.45, z: 0, isFiltered: false, isValid: true }
    }
  ],
  absolute: [
    { touchId: 0, confidence: 10, time: 1234567, type: 0,
      extremumDescription: { type: 0, numFittingPoints:10, percentageFittingPoints: 100 },
      position: { x: 200, y: 300, z: 60, isFiltered: false, isValid: true }
    },
    { touchId: 1, confidence: 5, time: 13343434242, type: 1,
      extremumDescription: { type: 1, numFittingPoints:5, percentageFittingPoints: 90 },
      position: { x: 400, y: 100, z: -60, isFiltered: false, isValid: true }
    },
    { touchId: 2, confidence: 15, time: 54654646, type: 2,
      extremumDescription: { type: 2, numFittingPoints:1, percentageFittingPoints: 10 },
      position: { x: 600, y: 900, z: 0, isFiltered: false, isValid: true }
    }
  ]
}

describe('InteractionsVisualizationComponent', () => {
  let component: InteractionsVisualizationComponent;
  let fixture: ComponentFixture<InteractionsVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
      FormsModule,
      InteractionsVisualizationComponent
    ],
    providers: [
        {
            provide: CalibrationService, useValue: calibrationService
        },
        {
            provide: LogService, useValue: logService
        },
        {
          provide: 'BASE_URL', useValue: 'http://localhost'
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
    })
    .overrideComponent(InteractionsVisualizationComponent, {
      remove: { imports: [ HistoryVisualizationComponent] },
      add: { imports: [ MockHistoryVisualizationComponent ] }
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractionsVisualizationComponent);
    component = fixture.componentInstance;
    logService.sendErrorLog.and.returnValue();
    calibrationService.getFrameSize.and.returnValue(of(customFrame));
  });

  afterEach(() => {
    calibrationService.getFrameSize.calls.reset()
    logService.sendErrorLog.calls.reset();

  });

  it('should create', () => {

    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize correct values', () => {

    fixture.detectChanges();

    expect(component.container).toBeDefined();
    expect(component.interactions.raw).toHaveSize(0);
    expect(component.interactions.normalized).toHaveSize(0);
    expect(component.interactions.absolute).toHaveSize(0);

    expect(component.calibratedInteractions).toHaveSize(0);

    expect(component.fullScreen).toBeFalse();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should update evenId', () => {
    fixture.detectChanges();

    expect(component.eventId).toBe(0);

    const evId = 1234;

    component.eventId =  evId;

    expect(component.eventId).toEqual(evId);
  });

  it ('should handle errors appropriately', () => {
    const errorFrameSize = 'TestError: calibrationService.getFrameSize';
    calibrationService.getFrameSize.and.returnValue(throwError(errorFrameSize));

    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).toHaveBeenCalledOnceWith(errorFrameSize);
  });

  it ('should update interactions', () => {
    fixture.detectChanges();

    expect(component.fullScreen).toBeFalse();

    component.updateCalibratedInteractions(testInteractionData);

    expect(component.interactions).toEqual(testInteractionData);
    expect(component.calibratedInteractions).toEqual(testInteractionData.normalized);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    component.fullScreen = true;

    component.updateCalibratedInteractions(testInteractionData);

    expect(component.calibratedInteractions).toEqual(testInteractionData.absolute);
  });

  it('should correctly apply style', () => {
    fixture.detectChanges();

    expect(component.fullScreen).toBeFalse();

    const expected1 = { position: 'relative', top: '0', left: '0', width: '100%', height: '40vh' };
    const expected2 = { position: 'absolute', top:  `${customFrame.top}px`, left: `${customFrame.left}px`, width: `${customFrame.width}px`, height: `${customFrame.height}px` };

    let style1 = component.getInteractionsViewStyle();

    expect(style1).toEqual(expected1);

    component.fullScreen = true;

    let style2 = component.getInteractionsViewStyle();

    expect(style2).toEqual(expected2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should return correct class based on extremum type', () => {

    const exp0 = 'interaction-minimum';
    const exp1 = 'interaction-maximum';
    const exp2 = 'interaction-undefined';

    const class0 = component.getClass(testInteractionData.raw[0].extremumDescription);
    const class1 = component.getClass(testInteractionData.raw[1].extremumDescription);
    const class2 = component.getClass(testInteractionData.raw[2].extremumDescription);

    expect(class0).toEqual(exp0);
    expect(class1).toEqual(exp1);
    expect(class2).toEqual(exp2);
  });

});
