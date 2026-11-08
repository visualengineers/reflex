import { HttpResponse } from '@angular/common/http';
import { FrameSizeDefinition, InteractionVelocity, Interaction } from '@reflex/shared-types';
import { Subject, of, throwError } from 'rxjs';
import { queryElement } from '../../../../../../../test/helpers/dom';
import {
  calibration,
  mount,
  processing,
  setupTests as setupZonelessTests,
  text
} from '../../test-utils/zoneless-change-detection.test-context';
import { frame, interactionData } from '../../test-utils/zoneless-change-detection.test-data';
import { predictionSnapshot } from '../interactions-velocity-visualization/interactions-velocity-visualization.component.test-data';
import { InteractionsVisualizationComponent } from './interactions-visualization.component';
import {
  component as testComponent,
  fixture as testFixture,
  setupTests
} from './interactions-visualization.component.test-context';
import {
  calibrationService,
  customFrame,
  logService,
  testInteractionData
} from './interactions-visualization.component.test-data';

const normalizeForOverlay = (item: Interaction): Interaction => ({ ...item,
  position: {
    ...item.position, x: (item.position.x / 400) + 0.1, y: (item.position.y / 200) - 0.05
  } });

describe('Zoneless change detection: renders imperative ViewChild interaction-visualization updates', () => {
  setupZonelessTests();

  it('renders imperative ViewChild interaction-visualization updates', async () => {
    const fixture = await mount(InteractionsVisualizationComponent);
    fixture.componentInstance.updateCalibratedInteractions(interactionData());
    await fixture.whenStable();
    expect(text(fixture)).toContain('Count: 1');
    expect(
      (fixture.nativeElement as HTMLInputElement).querySelectorAll('.interactions__point').length
    ).toBe(1);
  });
});

describe('Zoneless change detection: updates visualization frame geometry after HTTP responses', () => {
  setupZonelessTests();

  it('updates visualization frame geometry after HTTP responses', async () => {
    const response = new Subject<FrameSizeDefinition>();
    calibration.getFrameSize.mockReturnValue(response);
    const fixture = await mount(InteractionsVisualizationComponent);

    queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#visualization-toggle')
      .click();
    await fixture.whenStable();
    response.next(frame);
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '.interactions__visualization').style
        .width
    ).toBe('640px');
  });
});

describe('InteractionsVisualizationComponent', () => {
  setupTests();

  it('should create', () => {
    testFixture.detectChanges();
    expect(testComponent).toBeTruthy();
  });

  it('should initialize correct values', () => {
    testFixture.detectChanges();

    expect(testComponent.container).toBeDefined();
    expect(testComponent.interactions.raw).toHaveLength(0);
    expect(testComponent.interactions.normalized).toHaveLength(0);
    expect(testComponent.interactions.absolute).toHaveLength(0);

    expect(testComponent.calibratedInteractions).toHaveLength(0);

    expect(testComponent.fullScreen).toBe(false);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should update evenId', () => {
    testFixture.detectChanges();

    expect(testComponent.eventId).toBe(0);

    const evId = 1234;

    testComponent.eventId = evId;

    expect(testComponent.eventId).toEqual(evId);
  });

  it('should handle errors appropriately', () => {
    const errorFrameSize = 'TestError: calibrationService.getFrameSize';
    calibrationService.getFrameSize.mockReturnValue(throwError(errorFrameSize));

    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorFrameSize);
  });

  it('should update interactions', () => {
    testFixture.detectChanges();

    expect(testComponent.fullScreen).toBe(false);

    const before = structuredClone(testInteractionData);
    testComponent.updateCalibratedInteractions(testInteractionData);

    expect(testComponent.interactions).toEqual(testInteractionData);
    expect(testComponent.calibratedInteractions[0].position.x).toBe(
      testInteractionData.normalized[0].position.x * testComponent.viewportWidth
    );
    testComponent.updateCalibratedInteractions(testInteractionData);
    expect(testInteractionData).toEqual(before);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    testComponent.fullScreen = true;

    testComponent.updateCalibratedInteractions(testInteractionData);

    expect(testComponent.calibratedInteractions[0].position.x).toBe(
      testInteractionData.absolute[0].position.x - customFrame.left
    );
    expect(testInteractionData).toEqual(before);
  });
});

describe('InteractionsVisualizationComponent', () => {
  setupTests();

  it('should correctly apply style', () => {
    testFixture.detectChanges();

    expect(testComponent.fullScreen).toBe(false);

    const expected1 = {
      position: 'relative',
      top: '0',
      left: '0',
      width: '100%',
      height: '40vh'
    };
    const expected2 = {
      position: 'absolute',
      top: `${customFrame.top}px`,
      left: `${customFrame.left}px`,
      width: `${customFrame.width}px`,
      height: `${customFrame.height}px`
    };

    const style1 = testComponent.getInteractionsViewStyle();

    expect(style1).toEqual(expected1);

    testComponent.fullScreen = true;

    const style2 = testComponent.getInteractionsViewStyle();

    expect(style2).toEqual(expected2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should return correct class based on extremum type', () => {
    const exp0 = 'interaction-minimum';
    const exp1 = 'interaction-maximum';
    const exp2 = 'interaction-undefined';

    const class0 = testComponent.getClass(
      testInteractionData.raw[0].extremumDescription
    );
    const class1 = testComponent.getClass(
      testInteractionData.raw[1].extremumDescription
    );
    const class2 = testComponent.getClass(
      testInteractionData.raw[2].extremumDescription
    );

    expect(class0).toEqual(exp0);
    expect(class1).toEqual(exp1);
    expect(class2).toEqual(exp2);
  });
});


function setupPredictionTests(): void {
  setupZonelessTests();

  beforeEach(() => {
    calibration.getFrameSize.mockReturnValue(of(frame));
    calibration.computeCalibratedPosition.mockImplementation((items: Array<Interaction>) => of(new HttpResponse({
      body: items.map(normalizeForOverlay)
    })));
  });

}

describe('Integrated prediction visualization', () => {
  setupPredictionTests();

  it('starts enabled, renders stream updates and forwards independent layer options', async () => {
    const stream = new Subject<Array<InteractionVelocity>>();
    processing.getVelocities.mockReturnValue(stream);
    const fixture = await mount(InteractionsVisualizationComponent);
    expect(fixture.componentInstance.showPrediction).toBe(true);
    expect(processing.getVelocities.mock.calls).toHaveLength(0);
    fixture.componentRef.setInput('isProcessing', true);
    await fixture.whenStable();
    stream.next([predictionSnapshot()]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const vis = fixture.componentInstance;
    expect(root.querySelector('.interactions__visualization app-interactions-velocity-visualization')).not.toBeNull();
    expect(Number(root.querySelector('.prediction__canvas .measured')?.getAttribute('cx'))).toBeCloseTo(0.35 * vis.viewportWidth);
    expect(Number(root.querySelector('.prediction__canvas .measured')?.getAttribute('cy'))).toBeCloseTo(0.15 * vis.viewportHeight);
    expect(calibration.computeCalibratedPosition.mock.calls[0][0]).toHaveLength(5);
    fixture.componentRef.setInput('showLinear', false);
    fixture.componentRef.setInput('showMatching', false);
    await fixture.whenStable();
    expect(root.querySelector('.linear.forecast')).toBeNull();
    expect(root.querySelector('.matching')).toBeNull();
    expect(root.querySelector('.accelerated.forecast')).not.toBeNull();
    expect(processing.getVelocities.mock.calls).toHaveLength(1);
  });

  it('aligns the overlay with interaction positions before and after switching to fullscreen', async () => {
    const stream = new Subject<Array<InteractionVelocity>>();
    processing.getVelocities.mockReturnValue(stream);
    const fixture = await mount(InteractionsVisualizationComponent);
    fixture.componentRef.setInput('isProcessing', true);
    await fixture.whenStable();
    const data = interactionData();
    data.normalized[0].position.x = 0.35;
    data.normalized[0].position.y = 0.15;
    data.absolute[0].position.x = frame.left + (0.35 * frame.width);
    data.absolute[0].position.y = frame.top + (0.15 * frame.height);
    const before = structuredClone(data);
    fixture.componentInstance.updateCalibratedInteractions(data);
    stream.next([predictionSnapshot()]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const assertAlignment = (): void => {
      const measured = root.querySelector('.prediction__canvas .measured');
      const [{ position }] = fixture.componentInstance.calibratedInteractions;
      expect(Number(measured?.getAttribute('cx'))).toBeCloseTo(position.x);
      expect(Number(measured?.getAttribute('cy'))).toBeCloseTo(position.y);
    };
    assertAlignment();
    root.querySelector<HTMLInputElement>('#visualization-toggle')?.click();
    await fixture.whenStable();
    assertAlignment();
    expect(fixture.componentInstance.viewportWidth).toBe(frame.width);
    expect(fixture.componentInstance.viewportHeight).toBe(frame.height);
    expect(data).toEqual(before);
  });

  it('rejects incomplete calibration responses instead of drawing sensor coordinates over interactions', async () => {
    const stream = new Subject<Array<InteractionVelocity>>();
    processing.getVelocities.mockReturnValue(stream);
    calibration.computeCalibratedPosition.mockReturnValue(of(new HttpResponse({ body: [] })));
    const fixture = await mount(InteractionsVisualizationComponent);
    fixture.componentRef.setInput('isProcessing', true);
    await fixture.whenStable();
    stream.next([predictionSnapshot()]);
    await fixture.whenStable();
    expect(fixture.componentInstance.predictionData).toEqual([]);
    expect(text(fixture)).toContain('Prediction stream or calibration unavailable.');
  });

});

describe('Prediction stream lifecycle', () => {
  setupPredictionTests();

  it('clears stale predictions and releases the stream on hiding, stopping and destruction', async () => {
    const stream = new Subject<Array<InteractionVelocity>>();
    processing.getVelocities.mockReturnValue(stream);
    const fixture = await mount(InteractionsVisualizationComponent);
    fixture.componentRef.setInput('isProcessing', true);
    await fixture.whenStable();
    stream.next([predictionSnapshot()]);
    await fixture.whenStable();
    fixture.componentRef.setInput('showPrediction', false);
    await fixture.whenStable();
    expect(stream.observed).toBe(false);
    expect(fixture.componentInstance.predictionData).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).querySelector('app-interactions-velocity-visualization')).toBeNull();
    fixture.componentRef.setInput('showPrediction', true);
    await fixture.whenStable();
    expect(stream.observed).toBe(true);
    expect(fixture.componentInstance.predictionData).toEqual([]);
    stream.next([predictionSnapshot()]);
    fixture.componentRef.setInput('isProcessing', false);
    await fixture.whenStable();
    expect(stream.observed).toBe(false);
    expect(fixture.componentInstance.predictionData).toEqual([]);
    fixture.componentRef.setInput('isProcessing', true);
    await fixture.whenStable();
    expect(stream.observed).toBe(true);
    fixture.destroy();
    expect(stream.observed).toBe(false);
  });

  it('clears predictions and displays a stream failure', async () => {
    const stream = new Subject<Array<InteractionVelocity>>();
    processing.getVelocities.mockReturnValue(stream);
    const fixture = await mount(InteractionsVisualizationComponent);
    fixture.componentRef.setInput('isProcessing', true);
    await fixture.whenStable();
    stream.next([predictionSnapshot()]);
    stream.error(new Error('disconnected'));
    await fixture.whenStable();
    expect(fixture.componentInstance.predictionData).toEqual([]);
    expect(text(fixture)).toContain('Prediction stream or calibration unavailable.');
  });
});
