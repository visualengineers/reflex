import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryVisualizationComponent } from './history-visualization.component';
import { LogService } from 'src/app/log/log.service';
import { ProcessingService } from 'src/shared/services/processing.service';
import { of, throwError } from 'rxjs';
import { Interaction, InteractionHistory, InteractionHistoryElement } from '@reflex/shared-types';

const processingService = jasmine.createSpyObj<ProcessingService>('fakeProcessingService',
  [
    'getStatus',
    'getHistory'
  ]
);

const logService = jasmine.createSpyObj<LogService>('fakeLogService',
  [
    'sendErrorLog'
  ]
);

let history = new Array<InteractionHistory>();

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

describe('HistoryVisualizationComponent', () => {
  let component: HistoryVisualizationComponent;
  let fixture: ComponentFixture<HistoryVisualizationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [HistoryVisualizationComponent],
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
    fixture = TestBed.createComponent(HistoryVisualizationComponent);
    component = fixture.componentInstance;

    logService.sendErrorLog.and.returnValue();
    processingService.getHistory.and.returnValue(of(history));
    processingService.getStatus.and.returnValue(of('Active'));
  });

  afterEach(() => {
    processingService.getHistory.calls.reset();
    logService.sendErrorLog.calls.reset();

    component.history = [];
  });

  it('should create', async () => {
    fixture.detectChanges();
    // await fixture.whenStable();

    expect(component.container).toBeDefined();

    expect(component).toBeTruthy();

    expect(processingService.getHistory).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(component.history).toEqual(history);
  });

  it('should handle empty status', () => {
    processingService.getStatus.and.returnValue(of(''));

    fixture.detectChanges();

    expect(component.history).toEqual([]);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

  });

  it('should handle errors correctly: status', () => {
    const errorStatus = 'TestError: processingService.getStatus';
    processingService.getStatus.and.returnValue(throwError(errorStatus));

    fixture.detectChanges();

    expect(component.history).toEqual([]);

    expect(logService.sendErrorLog).toHaveBeenCalledOnceWith(errorStatus);
  });

  it('should handle errors correctly: history', () => {
    const errorHistory = 'TestError: processingService.getHistory';
    processingService.getHistory.and.returnValue(throwError(errorHistory));

    fixture.detectChanges();

    expect(component.history).toEqual([]);

    expect(logService.sendErrorLog).toHaveBeenCalledOnceWith(errorHistory);
  });
});
