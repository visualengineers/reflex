import { FrameSizeDefinition } from '@reflex/shared-types';
import { Subject, throwError } from 'rxjs';
import { queryElement } from '../../../../../../../test/helpers/dom';
import {
  calibration,
  mount,
  setupTests as setupZonelessTests,
  text
} from '../../test-utils/zoneless-change-detection.test-context';
import { frame, interactionData } from '../../test-utils/zoneless-change-detection.test-data';
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

    testComponent.updateCalibratedInteractions(testInteractionData);

    expect(testComponent.interactions).toEqual(testInteractionData);
    expect(testComponent.calibratedInteractions).toEqual(
      testInteractionData.normalized
    );

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    testComponent.fullScreen = true;

    testComponent.updateCalibratedInteractions(testInteractionData);

    expect(testComponent.calibratedInteractions).toEqual(
      testInteractionData.absolute
    );
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
