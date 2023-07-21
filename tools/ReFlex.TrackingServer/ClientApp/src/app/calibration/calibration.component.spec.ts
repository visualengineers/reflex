import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CalibrationComponent } from './calibration.component';
import { LogService } from '../log/log.service';
import { SettingsService } from 'src/shared/services/settingsService';
import { ProcessingService } from 'src/shared/services/processing.service';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CalibrationService } from 'src/shared/services/calibration.service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { DEFAULT_SETTINGS } from 'src/shared/trackingServerAppSettings.default';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { MockPanelHeaderComponent } from '../elements/panel-header/panel-header.component.mock';
import { CompleteInteractionData } from 'src/shared/interactions/complete-interaction.data';
import { CalibrationTransform } from 'src/shared/config/calibrationTransform';
import { CalibrationPoint } from 'src/shared/config/calibrationPoint';
import { FrameSizeDefinition } from 'src/shared/config/frameSizeDefinition';
import { By } from '@angular/platform-browser';
import { Interaction } from 'src/shared/processing/interaction';

const calibrationService = jasmine.createSpyObj<CalibrationService>('fakeCalibrationService', 
  [
    'getCalibrationMatrix',
    'getCalibrationSourcePoints', 
    'getCurrentCalibrationTargetPoints', 
    'getFrameSize',
    'computeCalibratedAbsolutePosition',
    'updateCalibrationPoint',
    'restartCalibration',
    'applyCalibration',
    'saveCalibration',
    'updateFrameSize'
  ]
);

const processingService = jasmine.createSpyObj<ProcessingService>('fakeProcessingCloudService',
  [
    'getStatus',
    'getInteractions'
  ]
);

const settingsService = jasmine.createSpyObj<SettingsService>('fakeSettingsService', 
  [
    'getSettings',
    'update'
  ]);

const logService = jasmine.createSpyObj<LogService>('fakeLogService', 
  [
    'sendErrorLog'
  ]);

const defaultInteractionData: CompleteInteractionData = {
  raw: [],
  normalized: [],
  absolute: []
};

const defaultSelectedInteraction : Interaction = { 
  touchId: -1, confidence: 0, type: 0,
  position: { x: 0, y: 0, z: 0, isFiltered: true, isValid: false },
  extremumDescription: { numFittingPoints: 0, percentageFittingPoints: 0, type: 0 },
  time: 0
 };

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

const defaultFrame = [ 100, 100, 500, 500];

const customFrame: FrameSizeDefinition = 
  { width: 500, height: 400, left: 150, top: 75 };

const defaultCalibrationMatrix: CalibrationTransform = {
  transformation: 
  [
    [2.0, 0.0, 0.0, 50.0],
    [0.0, 3.0, 0.0, 60.0],
    [0.0, 0.0, 4.0, 70.0],
    [0.0, 0.0, 0.0, 1.0]
  ]
};

const identityCalibrationMatrix: CalibrationTransform = {
  transformation: 
  [
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0],
    [0.0, 0.0, 0.0, 1.0]
  ]
};

const sourcePoints: CalibrationPoint[] = 
[
  { positionX: 150, positionY: 100, touchId: -1 },
  { positionX: 350, positionY: 100, touchId: -1 },
  { positionX: 150, positionY: 200, touchId: -1 }
];

const targetPoints: CalibrationPoint[] = 
[
  { positionX: 150, positionY: 100, touchId: -1 },
  { positionX: 350, positionY: 100, touchId: -1 },
  { positionX: 150, positionY: 200, touchId: -1 }
]

let submitSpy: jasmine.Spy;
let httpClient: HttpClient;
let httpTestingController: HttpTestingController;

describe('CalibrationComponent', () => {
  let component: CalibrationComponent;
  let fixture: ComponentFixture<CalibrationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CalibrationComponent, MockPanelHeaderComponent ],
      imports: [
        FormsModule,
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: CalibrationService, useValue: calibrationService
        },
        {
          provide: ProcessingService, useValue: processingService
        },
        {
          provide: SettingsService, useValue: settingsService
        },
        {
          provide: LogService, useValue: logService
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {

    // reset services
    calibrationService.getCalibrationMatrix.and.returnValue(of(identityCalibrationMatrix));
    calibrationService.getCalibrationSourcePoints.and.returnValue(of(sourcePoints));
    calibrationService.getCurrentCalibrationTargetPoints.and.returnValue(of(targetPoints));
    calibrationService.getFrameSize.and.returnValue(of(customFrame));
    calibrationService.computeCalibratedAbsolutePosition.and.returnValue(of(defaultInteractionData));  
    calibrationService.restartCalibration.and.returnValue(of(identityCalibrationMatrix));

    processingService.getInteractions.and.returnValue(of([]));
    processingService.getStatus.and.returnValue(of('Active'));

    settingsService.getSettings.and.returnValue(of(DEFAULT_SETTINGS));
    settingsService.update.and.returnValue();

    logService.sendErrorLog.and.returnValue();

    fixture = TestBed.createComponent(CalibrationComponent);
    component = fixture.componentInstance;

    submitSpy = spyOn(component, 'submit').and.callThrough();

  });

  afterEach(() => {
    calibrationService.getCalibrationMatrix.calls.reset();
    calibrationService.getCalibrationSourcePoints.calls.reset();
    calibrationService.getCurrentCalibrationTargetPoints.calls.reset();
    calibrationService.getFrameSize.calls.reset();
    calibrationService.computeCalibratedAbsolutePosition.calls.reset();
    calibrationService.updateCalibrationPoint.calls.reset();
    calibrationService.updateFrameSize.calls.reset();
    calibrationService.restartCalibration.calls.reset();

    processingService.getInteractions.calls.reset();
    processingService.getStatus.calls.reset();

    settingsService.getSettings.calls.reset();
    settingsService.update.calls.reset();

    logService.sendErrorLog.calls.reset(); 

    component.resetCalibration();
    component.calibrationMatrix = identityCalibrationMatrix.transformation;
    
    submitSpy.calls.reset();
  });

  it('should create', () => {  
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(component.submit).not.toHaveBeenCalled();
  });

  it('should initialize values correctly', () => {  
    
    calibrationService.getCalibrationMatrix.and.returnValue(of(defaultCalibrationMatrix));

    fixture.detectChanges();    
    
    expect(component).toBeTruthy();
    expect(component.isInteractiveCalibrationVisible).toBeFalse();

    expect(component.borderOffset).toEqual([customFrame.top, customFrame.left, customFrame.top + customFrame.height, customFrame.left + customFrame.width]);
    expect(component.calibrationSource).toEqual(sourcePoints);
    expect(component.calibratedTargets).toEqual(targetPoints);

    expect(component.calibrationMatrix).toEqual(defaultCalibrationMatrix.transformation);

    expect(component.interactions).toEqual([]);

    expect(component['view']).toBeTruthy();
  
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(component.submit).not.toHaveBeenCalled();

    expect(component['maxConfidence']).toBe(30);
    expect(component['maxConfidence']).toEqual(DEFAULT_SETTINGS.filterSettingValues.confidence.max);
  });

  it('should toggle CalibrationView', () => {
    fixture.detectChanges();

    expect(component.isInteractiveCalibrationVisible).toBeFalse();

    let calib = fixture.debugElement.query(By.css('.calibration__background')).nativeElement as HTMLElement;
    expect(calib).toBeTruthy();
    expect(calib.style.visibility).toEqual('collapse');
    expect(calib.classList).not.toContain('fullScreen');
    
    component.toggleCalibrationMode();

    expect(component.isInteractiveCalibrationVisible).toBeTrue();
    fixture.detectChanges();

    expect(calib).toBeTruthy();
    expect(calib.style.visibility).toEqual('visible');
    expect(calib.classList).toContain('fullScreen');

    component.toggleCalibrationMode();

    expect(component.isInteractiveCalibrationVisible).toBeFalse();
    fixture.detectChanges();

    expect(calib).toBeTruthy();
    expect(calib.style.visibility).toEqual('collapse');
    expect(calib.classList).not.toContain('fullScreen');

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(component.submit).not.toHaveBeenCalled();
  });

  it('should reset borders correctly', () => {  
    
    fixture.detectChanges();    
    
    expect(component).toBeTruthy();

    expect(component.borderOffset).toEqual([customFrame.top, customFrame.left, customFrame.top + customFrame.height, customFrame.left + customFrame.width]);

    component.resetBorders();

    expect(component.borderOffset).toEqual(defaultFrame);
  
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(component.submit).not.toHaveBeenCalled();
  });

  it('should toggle between raw and calibrated interactions', async () => {  
    
    let obs = new BehaviorSubject<Interaction[]>([]);

    processingService.getInteractions.and.returnValue(obs);
    calibrationService.computeCalibratedAbsolutePosition.withArgs(testInteractionData.normalized).and.returnValue(of(testInteractionData));
    calibrationService.computeCalibratedAbsolutePosition.withArgs([]).and.returnValue(of(defaultInteractionData));

    fixture.detectChanges();

    expect(calibrationService.computeCalibratedAbsolutePosition).toHaveBeenCalledTimes(1);
    expect(calibrationService.computeCalibratedAbsolutePosition).toHaveBeenCalledWith([]);
    
    obs.next(testInteractionData.normalized);
    
    expect(component).toBeTruthy();
    expect(component.update).toBeFalse();
    expect(component.displayCalibratedInteractions).toBeFalse();
    expect(component.isProcessingActive).toBeTrue();

    expect(component.interactions).toEqual([]);
    expect(component.calibratedInteractions).toEqual([]);

    expect(calibrationService.computeCalibratedAbsolutePosition).toHaveBeenCalledTimes(2);
    expect(calibrationService.computeCalibratedAbsolutePosition).toHaveBeenCalledWith(testInteractionData.normalized);

    component.update = true;
    fixture.detectChanges();

    obs.next(testInteractionData.normalized);

    expect(component.update).toBeTrue();
    expect(component.displayCalibratedInteractions).toBeFalse();
    expect(component.isProcessingActive).toBeTrue();
    
    await fixture.whenStable();

    expect(component.interactions).toEqual(testInteractionData.raw);
    expect(component.calibratedInteractions).toEqual(testInteractionData.raw);

    expect(calibrationService.computeCalibratedAbsolutePosition).toHaveBeenCalledTimes(3);
    expect(calibrationService.computeCalibratedAbsolutePosition).toHaveBeenCalledWith([]);
    expect(calibrationService.computeCalibratedAbsolutePosition).toHaveBeenCalledWith(testInteractionData.normalized);

    component.displayCalibratedInteractions = true;

    obs.next([]);
    
    expect(component.interactions).toEqual([]);
    expect(component.calibratedInteractions).toEqual([]);
    expect(calibrationService.computeCalibratedAbsolutePosition).toHaveBeenCalledTimes(4);

    obs.next(testInteractionData.normalized);

    expect(component.interactions).toEqual(testInteractionData.raw);
    expect(component.calibratedInteractions).toEqual(testInteractionData.absolute);
    expect(calibrationService.computeCalibratedAbsolutePosition).toHaveBeenCalledTimes(5);

    component.update = false;
    component.updateCalibrationToggle();    

    expect(component.displayCalibratedInteractions).toBeFalse();
    expect(component.interactions).toEqual([]);
    expect(component.calibratedInteractions).toEqual([]);

    obs.next(testInteractionData.normalized);

    expect(component.interactions).toEqual([]);
    expect(component.calibratedInteractions).toEqual([]);

    expect(calibrationService.computeCalibratedAbsolutePosition).toHaveBeenCalledTimes(6);
    
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(component.submit).not.toHaveBeenCalled();
  });

  it ('should update focus borders correctly', () => {
    fixture.detectChanges();

    spyOn(component, 'focusBorder').and.callThrough();
    spyOn(component, 'releaseBorder').and.callThrough();
    spyOn(component, 'releaseAllBorders').and.callThrough();

    expect(component.focusBorder).not.toHaveBeenCalled();
    expect(component.releaseBorder).not.toHaveBeenCalled();
    expect(component.releaseAllBorders).not.toHaveBeenCalled();

    expect(component['selectedBorderIndex']).toBe(-1);

    let background = fixture.debugElement.query(By.css('.calibration__background')).nativeElement as HTMLElement;

    let border0 = fixture.debugElement.query(By.css('#calibration-border-top')).nativeElement as HTMLElement;
    let border1 = fixture.debugElement.query(By.css('#calibration-border-left')).nativeElement as HTMLElement;
    let border2 = fixture.debugElement.query(By.css('#calibration-border-bottom')).nativeElement as HTMLElement;
    let border3 = fixture.debugElement.query(By.css('#calibration-border-right')).nativeElement as HTMLElement;    

    expect(background).toBeTruthy();
    expect(border0).toBeTruthy();
    expect(border1).toBeTruthy();
    expect(border2).toBeTruthy();
    expect(border3).toBeTruthy();

    border0.dispatchEvent(new Event('mousedown'));

    expect(component.focusBorder).toHaveBeenCalledOnceWith(0);
    expect(component['selectedBorderIndex']).toBe(0);

    border1.dispatchEvent(new Event('mousedown'));

    expect(component.focusBorder).toHaveBeenCalledTimes(2);
    expect(component.focusBorder).toHaveBeenCalledWith(1);
    expect(component['selectedBorderIndex']).toBe(1);

    background.dispatchEvent(new Event('mouseup'));

    expect(component.releaseAllBorders).toHaveBeenCalledTimes(1);
    expect(component['selectedBorderIndex']).toBe(-1);

    border3.dispatchEvent(new Event('mousedown'));
    expect(component.focusBorder).toHaveBeenCalledTimes(3);
    expect(component.focusBorder).toHaveBeenCalledWith(3);
    expect(component['selectedBorderIndex']).toBe(3);

    border3.dispatchEvent(new Event('mouseup'));
    expect(component.releaseBorder).toHaveBeenCalledOnceWith(3);
    expect(component.releaseAllBorders).toHaveBeenCalledTimes(1);
    expect(component['selectedBorderIndex']).toBe(-1);

    border2.dispatchEvent(new Event('mousedown'));
    expect(component.focusBorder).toHaveBeenCalledTimes(4);
    expect(component.focusBorder).toHaveBeenCalledWith(2);
    expect(component['selectedBorderIndex']).toBe(2);

    border3.dispatchEvent(new Event('mouseup'));
    expect(component.releaseBorder).toHaveBeenCalledTimes(2);
    expect(component.releaseBorder).not.toHaveBeenCalledWith(2);
    expect(component.releaseAllBorders).toHaveBeenCalledTimes(1);
    expect(component['selectedBorderIndex']).toBe(2);

    border1.dispatchEvent(new Event('mouseleave'));
    expect(component.releaseBorder).toHaveBeenCalledTimes(3);
    expect(component.releaseBorder).toHaveBeenCalledWith(1);
    expect(component.releaseBorder).not.toHaveBeenCalledWith(2);
    expect(component.releaseAllBorders).toHaveBeenCalledTimes(1);
    expect(component['selectedBorderIndex']).toBe(2);

    border2.dispatchEvent(new Event('mouseup'));
    expect(component.releaseBorder).toHaveBeenCalledTimes(4);
    expect(component.releaseBorder).toHaveBeenCalledWith(2);
    expect(component.releaseAllBorders).toHaveBeenCalledTimes(1);
    expect(component['selectedBorderIndex']).toBe(-1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(component.submit).not.toHaveBeenCalled();
  });

  it ('should update border offset correctly', () => {
    fixture.detectChanges();

    let startValues = [customFrame.top, customFrame.left, customFrame.top + customFrame.height, customFrame.left + customFrame.width];

    expect(component['selectedBorderIndex']).toBe(-1);

    expect(component.borderOffset).toEqual(startValues);

    component.onmouseMove(new MouseEvent('mousemove', { movementX: 10, movementY: -15 }));

    // don't move, because nothing is selected
    expect(component.borderOffset).toEqual(startValues);

    component.focusBorder(4);

    expect(component['selectedBorderIndex']).toBe(4);

    component.onmouseMove(new MouseEvent('mousemove', { movementX: 10, movementY: -15 }));

    // don't move, because nothing is selected
    expect(component.borderOffset).toEqual(startValues);

    component.focusBorder(0);

    expect(component['selectedBorderIndex']).toBe(0);

    component.onmouseMove(new MouseEvent('mousemove', { movementX: 10, movementY: 0 }));

    // don't move, top border only moves in y direction
    expect(component.borderOffset).toEqual(startValues);

    component.onmouseMove(new MouseEvent('mousemove', { movementX: 10, movementY: 2*-startValues[1] }));

    // don't move top border out of the screen
    expect(component.borderOffset[0]).toEqual(0);
    expect(component.borderOffset[0]).not.toBeCloseTo(-startValues[1], 4);
    expect(component.borderOffset[1]).toEqual(startValues[1]);
    expect(component.borderOffset[2]).toEqual(startValues[2]);
    expect(component.borderOffset[3]).toEqual(startValues[3]);

    component.focusBorder(1);
    expect(component['selectedBorderIndex']).toBe(1);

    component.onmouseMove(new MouseEvent('mousemove', { movementX: -0.5 * startValues[1], movementY: 10000 }));

    // only move in x direction
    expect(component.borderOffset[0]).toEqual(0);
    expect(component.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
    expect(component.borderOffset[2]).toEqual(startValues[2]);
    expect(component.borderOffset[3]).toEqual(startValues[3]);

    component.focusBorder(3);
    expect(component['selectedBorderIndex']).toBe(3);

    // collision with border1
    component.onmouseMove(new MouseEvent('mousemove', { movementX: -startValues[3] + (0.5 * startValues[1]) + 60, movementY: 10000 }));

    // don't move to prevent collision
    expect(component.borderOffset[0]).toEqual(0);
    expect(component.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
    expect(component.borderOffset[2]).toEqual(startValues[2]);
    expect(component.borderOffset[3]).not.toBeCloseTo((0.5 * startValues[1]) + 60, 4);
    expect(component.borderOffset[3]).toEqual(startValues[3]);

    // correct movement
    component.onmouseMove(new MouseEvent('mousemove', { movementX: -startValues[3] + (0.5 * startValues[1]) + 80, movementY: 10000 }));

    expect(component.borderOffset[0]).toEqual(0);
    expect(component.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
    expect(component.borderOffset[2]).toEqual(startValues[2]);
    expect(component.borderOffset[3]).toBeCloseTo((0.5 * startValues[1]) + 80, 4);

    component.focusBorder(0);

    expect(component['selectedBorderIndex']).toBe(0);

    component.onmouseMove(new MouseEvent('mousemove', { movementX: 10, movementY: startValues[0] }));

    expect(component.borderOffset[0]).toEqual(startValues[0]);
    expect(component.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
    expect(component.borderOffset[2]).toEqual(startValues[2]);
    expect(component.borderOffset[3]).toBeCloseTo((0.5 * startValues[1]) + 80, 4);


    component.focusBorder(2);
    expect(component['selectedBorderIndex']).toBe(2);

    // move beyond other border... 
    component.onmouseMove(new MouseEvent('mousemove', { movementX: 200, movementY: -startValues[2] + startValues[0] - 75 }));

    expect(component.borderOffset[0]).toEqual(startValues[0]);
    expect(component.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
    expect(component.borderOffset[2]).not.toBeCloseTo(startValues[0] - 75, 4);
    expect(component.borderOffset[2]).toEqual(startValues[2]);
    expect(component.borderOffset[3]).toBeCloseTo((0.5 * startValues[1]) + 80, 4);

    // move very close, but not within collision range (threshold is 70)
    component.onmouseMove(new MouseEvent('mousemove', { movementX: 200, movementY: -startValues[2] + startValues[0] + 75 }));

    expect(component.borderOffset[0]).toEqual(startValues[0]);
    expect(component.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
    expect(component.borderOffset[2]).toEqual(startValues[0] + 75);
    expect(component.borderOffset[3]).toBeCloseTo((0.5 * startValues[1]) + 80, 4);

    component.focusBorder(0);

    expect(component['selectedBorderIndex']).toBe(0);

    // move beyond in positive direction... 
    component.onmouseMove(new MouseEvent('mousemove', { movementX: 10, movementY: 200 }));

    expect(component.borderOffset[0]).not.toBeCloseTo(startValues[0] + 200, 4);
    expect(component.borderOffset[0]).toEqual(startValues[0]);
    expect(component.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
    expect(component.borderOffset[2]).toEqual(startValues[0] + 75);
    expect(component.borderOffset[3]).toBeCloseTo((0.5 * startValues[1]) + 80, 4);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(component.submit).not.toHaveBeenCalled();
  });

  it ('should correctly submit borders to webservice', () => {
    fixture.detectChanges();

    let startValues = [customFrame.top, customFrame.left, customFrame.top + customFrame.height, customFrame.left + customFrame.width];

    const newTop = customFrame.top*0.5;
    const newLeft = customFrame.left*0.75;

    const newHeight = 1.5*customFrame.height; 
    const newWidth = 2*customFrame.width;

    let newValues = [newTop, newLeft, newTop + newHeight, newLeft + newWidth];

    const def: FrameSizeDefinition = { width: newWidth, height: newHeight, left: newLeft, top: newTop };

    // return a modified frame to check if values are updated
    const responseDef: FrameSizeDefinition = { width: newWidth*1.1, height: newHeight*1.2, left: newLeft*0.9, top: newTop * 0.8 }

    expect(component.borderOffset).toEqual(startValues);

    component.borderOffset = newValues;

    calibrationService.updateFrameSize.withArgs(def).and.returnValue(of(new HttpResponse({body: responseDef})));

    component.updateFrameSize();

    expect(calibrationService.updateFrameSize).toHaveBeenCalledOnceWith(def);

    expect(component.borderOffset[0]).toBeCloseTo(newTop * 0.8, 4);
    expect(component.borderOffset[1]).toBeCloseTo(newLeft * 0.9, 4);

    expect(component.borderOffset[2]).toBeCloseTo(newTop * 0.8 + newHeight*1.2, 4);
    expect(component.borderOffset[3]).toBeCloseTo(newLeft * 0.9 + newWidth*1.1, 4);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it ('should correctly handle errors when submitting frame to server', () => {
    fixture.detectChanges();

    let startValues = [customFrame.top, customFrame.left, customFrame.top + customFrame.height, customFrame.left + customFrame.width];

    expect(component.borderOffset).toEqual(startValues);

    const errorFrameUpdate = 'Test Error: calibrationService.updateFrameSize';
    calibrationService.updateFrameSize.and.returnValue(throwError(errorFrameUpdate));

    component.updateFrameSize();

    expect(calibrationService.updateFrameSize).toHaveBeenCalledOnceWith(customFrame);   

    expect(logService.sendErrorLog).toHaveBeenCalledOnceWith(errorFrameUpdate);    
  });

  it ('should correctly update selected interaction', () => {
    let obs = new BehaviorSubject<Interaction[]>([]);

    const reduced1 = [testInteractionData.normalized[1], testInteractionData.normalized[0]];
    const reduced2 = [testInteractionData.normalized[0], testInteractionData.normalized[1]];
    const reduced3 = [testInteractionData.normalized[0]];

    const reduced1conv = { 
      raw: [testInteractionData.raw[1], testInteractionData.raw[0]],
      normalized: [testInteractionData.normalized[1], testInteractionData.normalized[0]],
      absolute: [testInteractionData.absolute[1], testInteractionData.absolute[0]]
    };
    const reduced2conv = { 
      raw: [testInteractionData.raw[0], testInteractionData.raw[1]],
      normalized: [testInteractionData.normalized[0], testInteractionData.normalized[1]],
      absolute: [testInteractionData.absolute[0], testInteractionData.absolute[1]]
    };
    const reduced3conv = { 
      raw: [testInteractionData.raw[0]],
      normalized: [testInteractionData.normalized[0]],
      absolute: [testInteractionData.absolute[0]]
    };

    processingService.getInteractions.and.returnValue(obs);
    calibrationService.computeCalibratedAbsolutePosition.withArgs(testInteractionData.normalized).and.returnValue(of(testInteractionData));
    calibrationService.computeCalibratedAbsolutePosition.withArgs(reduced1).and.returnValue(of(reduced1conv));
    calibrationService.computeCalibratedAbsolutePosition.withArgs(reduced2).and.returnValue(of(reduced2conv));
    calibrationService.computeCalibratedAbsolutePosition.withArgs(reduced3).and.returnValue(of(reduced3conv));

    component.update = true;

    fixture.detectChanges();    

    expect(component.update).toBeTrue();
    expect(component.displayCalibratedInteractions).toBeFalse();
    expect(component.isProcessingActive).toBeTrue();
    
    fixture.whenStable();   

    // expect array of selected values to be init / reset to default values
    expect(component.selectedIdx).toBe(-1);
    expect(component.selectedValue).toHaveSize(3);
    expect(component.selectedValue[0]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[1]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[2]).toEqual(defaultSelectedInteraction);
    
    expect(component.interactions).toEqual([]);
    expect(component.calibratedInteractions).toEqual([]);

    // start calibration
    component.display(0);
    
    obs.next(testInteractionData.normalized);
    
    expect(component.interactions).toEqual(testInteractionData.raw);
    expect(component.calibratedInteractions).toEqual(testInteractionData.raw);

    // auto-select first interaction
    expect(component.selectedIdx).toBe(0);
    expect(component.selectedValue[component['currentlyActiveStage']]).toBeDefined();
    expect(component.selectedValue[component['currentlyActiveStage']]).toEqual(testInteractionData.raw[0]);

    // deselect
    component.select(0);
    
    expect(component.selectedIdx).toBe(-1);
    expect(component.selectedValue).toHaveSize(3);
    expect(component.selectedValue[0]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[1]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[2]).toEqual(defaultSelectedInteraction);
    

    component.select(2);
    expect(component.selectedIdx).toBe(2);
    expect(component.selectedValue[component['currentlyActiveStage']]).toBeDefined();
    expect(component.selectedValue[component['currentlyActiveStage']]).toEqual(testInteractionData.raw[2]);

    // out of range...
    component.select(3);
    expect(component.selectedIdx).toBe(-1);
    expect(component.selectedValue).toHaveSize(3);
    expect(component.selectedValue[0]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[1]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[2]).toEqual(defaultSelectedInteraction);
    

    component.select(1);
    expect(component.selectedIdx).toBe(1);
    expect(component.selectedValue[component['currentlyActiveStage']]).toBeDefined();
    expect(component.selectedValue[component['currentlyActiveStage']]).toEqual(testInteractionData.raw[1]);

    // reset, if interactions change
    obs.next([]);
    expect(component.selectedIdx).toBe(-1);
    expect(component.selectedValue).toHaveSize(3);
    expect(component.selectedValue[0]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[1]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[2]).toEqual(defaultSelectedInteraction);
    

    obs.next(testInteractionData.normalized);

    component.select(1);
    expect(component.selectedIdx).toBe(1);
    expect(component.selectedValue[component['currentlyActiveStage']]).toBeDefined();
    expect(component.selectedValue[component['currentlyActiveStage']]).toEqual(testInteractionData.raw[1]);

    expect(component.selectedValue[0].touchId).toBe(1);

    // keep selected index in sync with touch id ?
    obs.next(reduced1);

    expect(component.selectedIdx).toBe(0);
    expect(component.selectedValue[component['currentlyActiveStage']]).toBeDefined();
    expect(component.selectedValue[component['currentlyActiveStage']]).toEqual(testInteractionData.raw[1]);

    obs.next(reduced2);

    expect(component.selectedIdx).toBe(1);
    expect(component.selectedValue[component['currentlyActiveStage']]).toBeDefined();
    expect(component.selectedValue[component['currentlyActiveStage']]).toEqual(testInteractionData.raw[1]);

    obs.next(reduced3);

    expect(component.selectedIdx).toBe(0);
    expect(component.selectedValue[component['currentlyActiveStage']]).toEqual(testInteractionData.raw[0]);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(component.submit).not.toHaveBeenCalled();

    obs.complete();
  });

  it('should correctly advance between stages when submitting manually', () => {
    let obs = new BehaviorSubject<Interaction[]>([]);

    const calib1 = [testInteractionData.normalized[0]];
    const calib2 = [testInteractionData.normalized[1]];
    const calib3 = [testInteractionData.normalized[2]];

    const calib1conv = { 
      raw: [testInteractionData.raw[0]],
      normalized: [testInteractionData.normalized[0]],
      absolute: [testInteractionData.absolute[0]]
    };
    const calib2conv = { 
      raw: [testInteractionData.raw[1]],
      normalized: [testInteractionData.normalized[1]],
      absolute: [testInteractionData.absolute[1]]
    };
    const calib3conv = { 
      raw: [testInteractionData.raw[2]],
      normalized: [testInteractionData.normalized[2]],
      absolute: [testInteractionData.absolute[2]]
    };

    const calibPoint1 = { positionX: calib1conv.raw[0].position.x, positionY: calib1conv.raw[0].position.y, touchId: 0 };
    const calibPoint2 = { positionX: calib2conv.raw[0].position.x, positionY: calib2conv.raw[0].position.y, touchId: 1 };
    const calibPoint3 = { positionX: calib3conv.raw[0].position.x, positionY: calib3conv.raw[0].position.y, touchId: 2 };

    processingService.getInteractions.and.returnValue(obs);
    calibrationService.computeCalibratedAbsolutePosition.withArgs(calib1).and.returnValue(of(calib1conv));
    calibrationService.computeCalibratedAbsolutePosition.withArgs(calib2).and.returnValue(of(calib2conv));
    calibrationService.computeCalibratedAbsolutePosition.withArgs(calib3).and.returnValue(of(calib3conv));

    let mat1 = structuredClone(identityCalibrationMatrix);
    mat1.transformation[0][0] = 2;
    mat1.transformation[1][1] = 2;
    mat1.transformation[2][2] = 2;

    let mat2 = structuredClone(identityCalibrationMatrix);
    mat2.transformation[1][0] = 3;
    mat2.transformation[2][1] = 3;
    mat2.transformation[3][2] = 3;

    let mat3 = structuredClone(identityCalibrationMatrix);
    mat3.transformation[3][0] = 4;
    mat3.transformation[3][1] = 4;
    mat3.transformation[3][2] = 4;

    const resp1 = new HttpResponse<CalibrationTransform>({ body: mat1});
    const resp2 = new HttpResponse<CalibrationTransform>({ body: mat2});
    const resp3 = new HttpResponse<CalibrationTransform>({ body: mat3});

    calibrationService.updateCalibrationPoint.withArgs(0, calibPoint1).and.returnValue(of(resp1));
    calibrationService.updateCalibrationPoint.withArgs(1, calibPoint2).and.returnValue(of(resp2));
    calibrationService.updateCalibrationPoint.withArgs(2, calibPoint3).and.returnValue(of(resp3));

    component.update = true;    
    fixture.detectChanges();    

    expect(component.update).toBeTrue();
    expect(component.displayCalibratedInteractions).toBeFalse();
    expect(component.isProcessingActive).toBeTrue(); 

    expect(component.selectedIdx).toBe(-1);
    expect(component.selectedValue).toHaveSize(3);
    expect(component.selectedValue[0]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[1]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[2]).toEqual(defaultSelectedInteraction);

    expect(component['currentlyActiveStage']).toBe(-1);

    component.display(0);
    
    obs.next(calib1);

    expect(component['currentlyActiveStage']).toBe(0);

    component.submit();

    fixture.detectChanges();

    expect(component['currentlyActiveStage']).toBe(1);
    expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledOnceWith(0, calibPoint1);
    expect(component.calibratedTargets[0]).toEqual(calibPoint1);
    expect(component.calibrationMatrix).toEqual(mat1.transformation);

    calibrationService.updateCalibrationPoint.calls.reset();

    obs.next(calib2);

    component.submit();

    fixture.detectChanges();

    expect(component['currentlyActiveStage']).toBe(2);
    expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledOnceWith(1, calibPoint2);
    expect(component.calibratedTargets[0]).toEqual(calibPoint1);
    expect(component.calibratedTargets[1]).toEqual(calibPoint2);
    expect(component.calibrationMatrix).toEqual(mat2.transformation);

    calibrationService.updateCalibrationPoint.calls.reset();

    obs.next(calib3);

    component.submit();

    fixture.detectChanges();

    expect(component['currentlyActiveStage']).toBe(-1);
    expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledOnceWith(2, calibPoint3);
    expect(component.calibratedTargets[0]).toEqual(calibPoint1);
    expect(component.calibratedTargets[1]).toEqual(calibPoint2);
    expect(component.calibratedTargets[2]).toEqual(calibPoint3);
    expect(component.calibrationMatrix).toEqual(mat3.transformation);

    calibrationService.updateCalibrationPoint.calls.reset();
  });

  it('should correctly advance between stages when confidence value is high enough', () => {
    let obs = new BehaviorSubject<Interaction[]>([]);

    const calib1 = [testInteractionData.normalized[0]];
    const calib2 = [testInteractionData.normalized[1]];
    const calib3 = [testInteractionData.normalized[2]];

    const calib1conv = { 
      raw: [testInteractionData.raw[0]],
      normalized: [testInteractionData.normalized[0]],
      absolute: [testInteractionData.absolute[0]]
    };
    const calib2conv = { 
      raw: [testInteractionData.raw[1]],
      normalized: [testInteractionData.normalized[1]],
      absolute: [testInteractionData.absolute[1]]
    };
    const calib3conv = { 
      raw: [testInteractionData.raw[2]],
      normalized: [testInteractionData.normalized[2]],
      absolute: [testInteractionData.absolute[2]]
    };

    const calibPoint1 = { positionX: calib1conv.raw[0].position.x, positionY: calib1conv.raw[0].position.y, touchId: 0 };
    const calibPoint2 = { positionX: calib2conv.raw[0].position.x, positionY: calib2conv.raw[0].position.y, touchId: 1 };
    const calibPoint3 = { positionX: calib3conv.raw[0].position.x, positionY: calib3conv.raw[0].position.y, touchId: 2 };

    processingService.getInteractions.and.returnValue(obs);
    calibrationService.computeCalibratedAbsolutePosition.withArgs(calib1).and.returnValue(of(calib1conv));
    calibrationService.computeCalibratedAbsolutePosition.withArgs(calib2).and.returnValue(of(calib2conv));
    calibrationService.computeCalibratedAbsolutePosition.withArgs(calib3).and.returnValue(of(calib3conv));

    let mat1 = structuredClone(identityCalibrationMatrix);
    mat1.transformation[0][0] = 2;
    mat1.transformation[1][1] = 2;
    mat1.transformation[2][2] = 2;

    let mat2 = structuredClone(identityCalibrationMatrix);
    mat2.transformation[1][0] = 3;
    mat2.transformation[2][1] = 3;
    mat2.transformation[3][2] = 3;

    let mat3 = structuredClone(identityCalibrationMatrix);
    mat3.transformation[3][0] = 4;
    mat3.transformation[3][1] = 4;
    mat3.transformation[3][2] = 4;

    const resp1 = new HttpResponse<CalibrationTransform>({ body: mat1});
    const resp2 = new HttpResponse<CalibrationTransform>({ body: mat2});
    const resp3 = new HttpResponse<CalibrationTransform>({ body: mat3});

    calibrationService.updateCalibrationPoint.withArgs(0, calibPoint1).and.returnValue(of(resp1));
    calibrationService.updateCalibrationPoint.withArgs(1, calibPoint2).and.returnValue(of(resp2));
    calibrationService.updateCalibrationPoint.withArgs(2, calibPoint3).and.returnValue(of(resp3));

    component.update = true;    
    fixture.detectChanges();    

    expect(component.update).toBeTrue();
    expect(component.displayCalibratedInteractions).toBeFalse();
    expect(component.isProcessingActive).toBeTrue(); 

    expect(component.selectedIdx).toBe(-1);
    expect(component.selectedValue).toHaveSize(3);
    expect(component.selectedValue[0]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[1]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[2]).toEqual(defaultSelectedInteraction);

    expect(component['currentlyActiveStage']).toBe(-1);

    obs.next(calib1);

    fixture.detectChanges();

    component.display(0);

    expect(component['currentlyActiveStage']).toBe(0);

    expect(component.selectedIdx).toBe(0);

    for (let i = 0; i < 100; i++) {
      let updated = structuredClone(calib1);
      updated[0].confidence = i;

      let updatedconv = { 
        raw: [structuredClone(testInteractionData.raw[0])],
        normalized: [structuredClone(testInteractionData.normalized[0])],
        absolute: [structuredClone(testInteractionData.absolute[0])]
      };

      updatedconv.raw[0].confidence = i;
      updatedconv.normalized[0].confidence = i;
      updatedconv.absolute[0].confidence = i;

      calibrationService.computeCalibratedAbsolutePosition.withArgs(updated).and.returnValue(of(updatedconv));

      obs.next(updated);
      
      fixture.detectChanges();

      if (i < 30) {
        expect(component['currentlyActiveStage']).toBe(0);
        expect(calibrationService.updateCalibrationPoint).not.toHaveBeenCalled();
        
      }
      else {
        expect(component['currentlyActiveStage']).toBe(1);
        expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledOnceWith(0, calibPoint1);
      }
    }    
  });

  it('not submit invalid values', () => {
    let obs = new BehaviorSubject<Interaction[]>([]);

    const calib1 = [testInteractionData.normalized[0]];
    
    const calib1conv = { 
      raw: [testInteractionData.raw[0]],
      normalized: [testInteractionData.normalized[0]],
      absolute: [testInteractionData.absolute[0]]
    };    

    const calibPoint1 = { positionX: calib1conv.raw[0].position.x, positionY: calib1conv.raw[0].position.y, touchId: 0 };    

    processingService.getInteractions.and.returnValue(obs);
    calibrationService.computeCalibratedAbsolutePosition.withArgs(calib1).and.returnValue(of(calib1conv));

    let mat1 = structuredClone(identityCalibrationMatrix);
    mat1.transformation[0][0] = 2;
    mat1.transformation[1][1] = 2;
    mat1.transformation[2][2] = 2;

    const resp1 = new HttpResponse<CalibrationTransform>({ body: mat1});

    calibrationService.updateCalibrationPoint.withArgs(0, calibPoint1).and.returnValue(of(resp1));

    component.update = true;    
    fixture.detectChanges();    

    expect(component.update).toBeTrue();
    expect(component.displayCalibratedInteractions).toBeFalse();
    expect(component.isProcessingActive).toBeTrue(); 

    expect(component.selectedIdx).toBe(-1);
    expect(component.selectedValue).toHaveSize(3);
    expect(component.selectedValue[0]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[1]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[2]).toEqual(defaultSelectedInteraction);

    expect(component['currentlyActiveStage']).toBe(-1);

    component.display(0);
    
    obs.next(calib1);    

    expect(component['currentlyActiveStage']).toBe(0);

    component.submit();

    fixture.detectChanges();

    expect(component['currentlyActiveStage']).toBe(1);
    expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledOnceWith(0, calibPoint1);
    expect(component.calibratedTargets[0]).toEqual(calibPoint1);
    expect(component.calibrationMatrix).toEqual(mat1.transformation);

    calibrationService.updateCalibrationPoint.calls.reset();

    component.display(0);

    expect(component['currentlyActiveStage']).toBe(0);    

    obs.next(calib1);

    component.select(0);

    expect(component.selectedValue).toHaveSize(3);
    expect(component.selectedValue[0]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[1]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[2]).toEqual(defaultSelectedInteraction);

    component.submit();

    fixture.detectChanges();

    expect(component['currentlyActiveStage']).toBe(0);
    expect(calibrationService.updateCalibrationPoint).not.toHaveBeenCalled();

    component.select(0);

    expect(component.selectedValue[0]?.touchId).toBeDefined();

    component.display(-1);

    expect(component['currentlyActiveStage']).toBe(-1);

    expect(component.selectedValue).toHaveSize(3);
    expect(component.selectedValue[0]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[1]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[2]).toEqual(defaultSelectedInteraction);

    component.submit();


    expect(component['currentlyActiveStage']).toBe(-1);
    expect(calibrationService.updateCalibrationPoint).not.toHaveBeenCalled();
  });

  it('handle errors during calibration correctly', () => {

    let obs = new BehaviorSubject<Interaction[]>([]);

    const calib1 = [testInteractionData.normalized[0]];
    
    const calib1conv = { 
      raw: [testInteractionData.raw[0]],
      normalized: [testInteractionData.normalized[0]],
      absolute: [testInteractionData.absolute[0]]
    };    

    const calibPoint1 = { positionX: calib1conv.raw[0].position.x, positionY: calib1conv.raw[0].position.y, touchId: 0 };    

    processingService.getInteractions.and.returnValue(obs);
    calibrationService.computeCalibratedAbsolutePosition.withArgs(calib1).and.returnValue(of(calib1conv));

    const calibrationError = 'Test Error: calibrationService.updateCalibrationPoint';
    calibrationService.updateCalibrationPoint.withArgs(0, calibPoint1).and.returnValue(throwError(calibrationError));

    component.update = true;    
    fixture.detectChanges();    

    expect(component.update).toBeTrue();
    expect(component.displayCalibratedInteractions).toBeFalse();
    expect(component.isProcessingActive).toBeTrue(); 

    expect(component.selectedIdx).toBe(-1);
    expect(component.selectedValue).toHaveSize(3);
    expect(component.selectedValue[0]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[1]).toEqual(defaultSelectedInteraction);
    expect(component.selectedValue[2]).toEqual(defaultSelectedInteraction);

    expect(component['currentlyActiveStage']).toBe(-1);      

    component.display(0);
    
    obs.next(calib1);

    expect(component['currentlyActiveStage']).toBe(0);

    component.submit();

    fixture.detectChanges();

    expect(component['currentlyActiveStage']).toBe(0);
    expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledOnceWith(0, calibPoint1);
    
    expect(logService.sendErrorLog).toHaveBeenCalledOnceWith(calibrationError);
    expect(component.calibrationMatrix).toEqual(identityCalibrationMatrix.transformation);

  });

  it ('should not activate an invalid state', () => {
    fixture.detectChanges();

    component.display(0); 

    expect(component['currentlyActiveStage']).toBe(0);

    component.display(-5);

    // negative values default to -1
    expect(component['currentlyActiveStage']).toBe(-1);

    component.display(2);

    expect(component['currentlyActiveStage']).toBe(2);    

    component.display(1);
    
    expect(component['currentlyActiveStage']).toBe(1);

    component.display(4);

    // ignore switching higher than 2
    expect(component['currentlyActiveStage']).toBe(1);

  });

  it ('should correctly apply calibration', () => {
    let result = structuredClone(identityCalibrationMatrix) as CalibrationTransform;
    for(let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result.transformation[i][j] = Math.floor((Math.random() * 100) + 1);
      }
    }

    calibrationService.applyCalibration.and.returnValue(of(result));

    component.display(1);
    expect(component['currentlyActiveStage']).toBe(1);

    component.applyCalibration();

    expect(component.calibrationMatrix).toEqual(result.transformation);
    expect(component['currentlyActiveStage']).toBe(-1);

    expect(calibrationService.applyCalibration).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    component.display(1);
    expect(component['currentlyActiveStage']).toBe(1);

    const errorApply = 'TestError: calibrationService.applyCalibration' 
    calibrationService.applyCalibration.and.returnValue(throwError(errorApply));

    component.applyCalibration();

    expect(component.calibrationMatrix).toEqual(result.transformation);
    expect(component['currentlyActiveStage']).toBe(-1);

    expect(calibrationService.applyCalibration).toHaveBeenCalledTimes(2);
    expect(logService.sendErrorLog).toHaveBeenCalledOnceWith(errorApply); 

  });

  it ('should correctly save calibration without changing local values', () => {   
    let result = structuredClone(identityCalibrationMatrix) as CalibrationTransform;
    for(let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result.transformation[i][j] = Math.floor((Math.random() * 100) + 1);
      }
    }

    calibrationService.saveCalibration.and.returnValue(of(result));

    expect(component.calibrationMatrix).toEqual(identityCalibrationMatrix.transformation);

    component.saveCalibration();

    expect(component.calibrationMatrix).not.toEqual(result.transformation);
    expect(component.calibrationMatrix).toEqual(identityCalibrationMatrix.transformation);

    expect(calibrationService.saveCalibration).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    const errorSave = 'TestError: calibrationService.saveCalibration' 
    calibrationService.saveCalibration.and.returnValue(throwError(errorSave));

    component.saveCalibration();

    expect(component.calibrationMatrix).toEqual(identityCalibrationMatrix.transformation);

    expect(calibrationService.saveCalibration).toHaveBeenCalledTimes(2);

    expect(logService.sendErrorLog).toHaveBeenCalledOnceWith(errorSave); 

  });

  it ('should handle errors appropriately and send logs: 1 - invalid status', async () => {    
    const errorStatus = 'TestError: processingService.getStatus';    
    processingService.getStatus.and.returnValue(throwError(errorStatus));
    
    const errorInteractions = 'TestError: processingService.getInteractions';    
    processingService.getInteractions.and.returnValue(throwError(errorInteractions));

    const errorSettings = 'TestError: settingsService.getSettings';
    settingsService.getSettings.and.returnValue(throwError(errorSettings));

    const errorCalibration = 'TestError: calibrationService.getFrameSize';
    calibrationService.getFrameSize.and.returnValue(throwError(errorCalibration));

    const errorMatrix = 'TestError: calibrationService.getCalibrationMatrix';
    calibrationService.getCalibrationMatrix.and.returnValue(throwError(errorMatrix));
    
    fixture.detectChanges();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(4);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
    // interactions are not queried, if status is false
    expect(logService.sendErrorLog).not.toHaveBeenCalledWith(errorInteractions);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSettings);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorCalibration);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorMatrix);

    expect(component).toBeTruthy();
    expect(component['view']).toBeTruthy();
    
    expect(component.submit).not.toHaveBeenCalled();
  });

  it ('should handle errors appropriately and send logs: 2 - valid status', async () => {    
    const errorInteractions = 'TestError: processingService.getInteractions';    
    processingService.getInteractions.and.returnValue(throwError(errorInteractions));

    const errorSettings = 'TestError: settingsService.getSettings';
    settingsService.getSettings.and.returnValue(throwError(errorSettings));

    const errorCalibration = 'TestError: calibrationService.getFrameSize';
    calibrationService.getFrameSize.and.returnValue(throwError(errorCalibration));

    const errorMatrix = 'TestError: calibrationService.getCalibrationMatrix';
    calibrationService.getCalibrationMatrix.and.returnValue(throwError(errorMatrix));

    const errorSource = 'TestError: calibrationService.getCalibrationSourcePoints';
    calibrationService.getCalibrationSourcePoints.and.returnValue(throwError(errorSource));

    const errorTarget = 'TestError: calibrationService.getCurrentCalibrationTargetPoints';
    calibrationService.getCurrentCalibrationTargetPoints.and.returnValue(throwError(errorTarget));
    
    fixture.detectChanges();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(6);

    // interactions are not queried, if status is false
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorInteractions);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSettings);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorCalibration);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorMatrix);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSource);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorTarget);

    expect(component).toBeTruthy();  
    expect(component['view']).toBeTruthy();
    
    expect(component.submit).not.toHaveBeenCalled();
  });

  it ('should handle errors appropriately and initialize default values', async () => {        
    const errorInteractions = 'TestError: processingService.getInteractions';    
    processingService.getInteractions.and.returnValue(throwError(errorInteractions));

    const errorSettings = 'TestError: settingsService.getSettings';
    settingsService.getSettings.and.returnValue(throwError(errorSettings));

    const errorCalibration = 'TestError: calibrationService.getFrameSize';
    calibrationService.getFrameSize.and.returnValue(throwError(errorCalibration));

    const errorMatrix = 'TestError: calibrationService.getCalibrationMatrix';
    calibrationService.getCalibrationMatrix.and.returnValue(throwError(errorMatrix));

    const errorSource = 'TestError: calibrationService.getCalibrationSourcePoints';
    calibrationService.getCalibrationSourcePoints.and.returnValue(throwError(errorSource));

    const errorTarget = 'TestError: calibrationService.getCurrentCalibrationTargetPoints';
    calibrationService.getCurrentCalibrationTargetPoints.and.returnValue(throwError(errorTarget));
    
    fixture.detectChanges();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(6);

    // interactions are not queried, if status is false
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorInteractions);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSettings);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorCalibration);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorMatrix);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSource);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorTarget);

    expect(component).toBeTruthy();
    expect(component['view']).toBeTruthy();

    expect(component.isInteractiveCalibrationVisible).toBeFalse();

    expect(component.borderOffset).toEqual(defaultFrame);
    expect(component.calibrationSource).toBeDefined();
    expect(component.calibrationSource).toHaveSize(3);
    expect(component.calibratedTargets).toBeDefined();
    expect(component.calibratedTargets).toHaveSize(3);

    expect(component.calibrationMatrix).toEqual(identityCalibrationMatrix.transformation);

    expect(component.interactions).toEqual([]);
    expect(component.calibratedInteractions).toEqual([]);
    
    expect(component.submit).not.toHaveBeenCalled();
  });
});
