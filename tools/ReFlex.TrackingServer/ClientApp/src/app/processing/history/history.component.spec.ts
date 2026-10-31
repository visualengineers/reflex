import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryComponent } from './history.component';
import { ProcessingService } from 'src/shared/services/processing.service';
import { LogService } from 'src/app/log/log.service';
import { of, throwError } from 'rxjs';
import {
  Interaction,
  InteractionFrame,
  InteractionHistory,
  InteractionHistoryElement,
} from '@reflex/shared-types';

const processingService = {
  getStatus: vi.fn().mockName('fakeProcessingCloudService.getStatus'),
  getFrames: vi.fn().mockName('fakeProcessingCloudService.getFrames'),
  getHistory: vi.fn().mockName('fakeProcessingCloudService.getHistory'),
};

const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog'),
};

let frames = new Array<InteractionFrame>();
let history = new Array<InteractionHistory>();

for (var i = 0; i < 16; i++) {
  let f: InteractionFrame = {
    frameId: 0,
    interactions: [],
  };

  for (var j = 0; j < 5; j++) {
    const x = Math.random();
    const y = Math.random();
    const z = Math.random();

    let base: Interaction = {
      time: 1234567,
      confidence: i,
      touchId: j,
      type: 1,
      position: { x: x, y: y, z: z, isFiltered: false, isValid: true },
      extremumDescription: {
        numFittingPoints: 10,
        percentageFittingPoints: 100,
        type: 1,
      },
    };
    f.interactions.push(base);
  }
  frames.push(f);
}

for (var i = 0; i < 4; i++) {
  let h: InteractionHistory = {
    touchId: i,
    items: [],
  };

  for (var j = 0; j < 20; j++) {
    const x = Math.random();
    const y = Math.random();
    const z = Math.random();

    let base: Interaction = {
      time: 1234567,
      confidence: j,
      touchId: i,
      type: 1,
      position: { x: x, y: y, z: z, isFiltered: false, isValid: true },
      extremumDescription: {
        numFittingPoints: 10,
        percentageFittingPoints: 100,
        type: 1,
      },
    };

    let e: InteractionHistoryElement = {
      frameId: 0,
      interaction: base,
    };
    h.items.push(e);
  }

  history.push(h);
}

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        {
          provide: ProcessingService,
          useValue: processingService,
        },
        {
          provide: LogService,
          useValue: logService,
        },
      ],
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
    processingService.getStatus.mockReturnValue(of(''));

    fixture.detectChanges();

    expect(component.frames).toEqual([]);
    expect(component.history).toEqual([]);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should handle errors correctly: status', () => {
    const errorStatus = 'TestError: processingService.getStatus';
    processingService.getStatus.mockReturnValue(throwError(errorStatus));

    fixture.detectChanges();

    expect(component.frames).toEqual([]);
    expect(component.history).toEqual([]);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(2);
  });

  it('should handle errors correctly: frames', () => {
    const errorFrames = 'TestError: processingService.getFrames';
    processingService.getFrames.mockReturnValue(throwError(errorFrames));

    fixture.detectChanges();

    expect(component.frames).toEqual([]);
    expect(component.history).toEqual(history);

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorFrames);
  });

  it('should handle errors correctly: history', () => {
    const errorHistory = 'TestError: processingService.getHistory';
    processingService.getHistory.mockReturnValue(throwError(errorHistory));

    fixture.detectChanges();

    expect(component.frames).toEqual(frames);
    expect(component.history).toEqual([]);

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorHistory);
  });
});
