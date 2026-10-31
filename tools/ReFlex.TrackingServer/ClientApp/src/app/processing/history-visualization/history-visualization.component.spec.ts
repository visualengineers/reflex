import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Interaction,
  InteractionHistory,
  InteractionHistoryElement
} from '@reflex/shared-types';
import { of, throwError, Subject } from 'rxjs';
import { LogService } from 'src/app/log/log.service';
import { ProcessingService } from 'src/shared/services/processing.service';
import {
  mount,
  processing,
  setupTests as setupZonelessTests
} from '../../test-utils/zoneless-change-detection.test-context';
import { interaction } from '../../test-utils/zoneless-change-detection.test-data';
import { HistoryVisualizationComponent } from './history-visualization.component';

const processingService = {
  getStatus: vi.fn().mockName('fakeProcessingService.getStatus'),
  getHistory: vi.fn().mockName('fakeProcessingService.getHistory')
};

const logService = {
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog')
};

const history = new Array<InteractionHistory>();

for (let i = 0; i < 4; i++) {
  const h: InteractionHistory = {
    touchId: i,
    items: []
  };

  for (let j = 0; j < 20; j++) {
    const x = Math.random();
    const y = Math.random();
    const z = Math.random();

    const base: Interaction = {
      time: 1234567,
      confidence: j,
      touchId: i,
      type: 1,
      position: { x: x, y: y, z: z, isFiltered: false, isValid: true },
      extremumDescription: {
        numFittingPoints: 10,
        percentageFittingPoints: 100,
        type: 1
      }
    };

    const e: InteractionHistoryElement = {
      frameId: 0,
      interaction: base
    };
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
    fixture = TestBed.createComponent(HistoryVisualizationComponent);
    component = fixture.componentInstance;

    logService.sendErrorLog.mockReturnValue(undefined);
    processingService.getHistory.mockReturnValue(of(history));
    processingService.getStatus.mockReturnValue(of('Active'));
  });

  afterEach(() => {
    processingService.getHistory.mockClear();
    logService.sendErrorLog.mockClear();

    component.history = [];
  });

  it('should create', () => {
    fixture.detectChanges();
    // await await fixture.whenStable();

    expect(component.container).toBeDefined();

    expect(component).toBeTruthy();

    expect(processingService.getHistory).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(component.history).toEqual(history);
  });

  it('should handle empty status', () => {
    processingService.getStatus.mockReturnValue(of(''));

    fixture.detectChanges();

    expect(component.history).toEqual([]);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should handle errors correctly: status', () => {
    const errorStatus = 'TestError: processingService.getStatus';
    processingService.getStatus.mockReturnValue(throwError(errorStatus));

    fixture.detectChanges();

    expect(component.history).toEqual([]);

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
  });

  it('should handle errors correctly: history', () => {
    const errorHistory = 'TestError: processingService.getHistory';
    processingService.getHistory.mockReturnValue(throwError(errorHistory));

    fixture.detectChanges();

    expect(component.history).toEqual([]);

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorHistory);
  });
});

describe('Zoneless change detection: renders history stream emissions in SVG', () => {
  setupZonelessTests();

  it('renders history stream emissions in SVG', async () => {
    processing.getStatus.mockReturnValue(of('Active'));
    const response = new Subject<Array<InteractionHistory>>();
    processing.getHistory.mockReturnValue(response);
    const fixture = await mount(HistoryVisualizationComponent);
    response.next([
      {
        touchId: 42,
        items: [{ frameId: 1, interaction: structuredClone(interaction) }]
      }
    ]);
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLInputElement).querySelectorAll('circle.history__point').length
    ).toBe(1);
  });
});
