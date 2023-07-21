import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryComponent } from './history.component';
import { ProcessingService } from 'src/shared/services/processing.service';
import { LogService } from 'src/app/log/log.service';
import { of, throwError } from 'rxjs';
import { Interaction } from 'src/shared/processing/interaction';
import { InteractionFrame } from 'src/shared/processing/interaction-frame';
import { InteractionHistory } from 'src/shared/processing/interaction-history';
import { InteractionHistoryElement } from 'src/shared/processing/interaction-history-element';
import { MockSettingsGroupComponent } from 'src/app/elements/settings-group/settings-group.component.mock';

const processingService = jasmine.createSpyObj<ProcessingService>('fakeProcessingCloudService',
  [
    'getStatus',
    'getFrames',
    'getHistory'
  ]
);

const logService = jasmine.createSpyObj<LogService>('fakeLogService', 
  [
    'sendErrorLog'
  ]
);

let frames = new Array<InteractionFrame>();
let history = new Array<InteractionHistory>();

for (var i = 0; i < 16; i++) {
  
  let f: InteractionFrame = {
    frameId: 0,
    interactions: []
  }
 
  for (var j = 0; j < 5; j++) {
    const x = Math.random();
    const y = Math.random();
    const z = Math.random();

    let base: Interaction =
      { time: 1234567, confidence: i, touchId: j, type: 1,
        position: { x: x, y: y, z: z, isFiltered: false, isValid: true }, 
        extremumDescription:{ numFittingPoints: 10, percentageFittingPoints: 100, type: 1 } 
      }      
    f.interactions.push(base);
  }
  frames.push(f);
}

for (var i = 0; i < 4; i++) {
  
  let h : InteractionHistory = {
    touchId: i,
    items: []
  }

  for (var j = 0; j < 20; j++) {   

    const x = Math.random();
    const y = Math.random();
    const z = Math.random();

    let base: Interaction =
      { time: 1234567, confidence: j, touchId: i, type: 1,
        position: { x: x, y: y, z: z, isFiltered: false, isValid: true }, 
        extremumDescription:{ numFittingPoints: 10, percentageFittingPoints: 100, type: 1 } 
      }

    let e: InteractionHistoryElement = {
      frameId: 0,
      interaction: base
    }    
    h.items.push(e);
  }
  
  history.push(h);
}

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ 
        HistoryComponent,
        MockSettingsGroupComponent
      ],
      providers: [
        {
          provide: ProcessingService, useValue: processingService
        },
        {
          provide: LogService, useValue: logService
        }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;

    logService.sendErrorLog.and.returnValue();
    processingService.getFrames.and.returnValue(of(frames));
    processingService.getHistory.and.returnValue(of(history));
    processingService.getStatus.and.returnValue(of('Active'));
  });

  afterEach(() => {
    processingService.getFrames.calls.reset(); 
    processingService.getHistory.calls.reset();
    logService.sendErrorLog.calls.reset();

    component.frames = [];
    component.history = [];
  });

  it('should create', () => {    
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(processingService.getHistory).toHaveBeenCalledTimes(1);
    expect(processingService.getFrames).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    expect(component.frames).toEqual(frames);
    expect(component.history).toEqual(history);
  });

  it('should handle empty status', () => {
    processingService.getStatus.and.returnValue(of(''));

    fixture.detectChanges();

    expect(component.frames).toEqual([]);
    expect(component.history).toEqual([]);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

  });

  it('should handle errors correctly: status', () => {
    const errorStatus = 'TestError: processingService.getStatus';
    processingService.getStatus.and.returnValue(throwError(errorStatus));

    fixture.detectChanges();

    expect(component.frames).toEqual([]);
    expect(component.history).toEqual([]);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(2);
  });

  it('should handle errors correctly: frames', () => {
    const errorFrames = 'TestError: processingService.getFrames';
    processingService.getFrames.and.returnValue(throwError(errorFrames));

    fixture.detectChanges();

    expect(component.frames).toEqual([]);
    expect(component.history).toEqual(history);

    expect(logService.sendErrorLog).toHaveBeenCalledOnceWith(errorFrames);    
  });

  it('should handle errors correctly: history', () => {
    const errorHistory = 'TestError: processingService.getHistory';
    processingService.getHistory.and.returnValue(throwError(errorHistory));

    fixture.detectChanges();

    expect(component.frames).toEqual(frames);
    expect(component.history).toEqual([]);

    expect(logService.sendErrorLog).toHaveBeenCalledOnceWith(errorHistory);    
  });
});
