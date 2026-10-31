import { throwError } from 'rxjs';
import { component, fixture, setupTests } from './interactions-visualization.component.test-context';
import { calibrationService, logService, testInteractionData } from './interactions-visualization.component.test-data';

describe('InteractionsVisualizationComponent', () => {
  setupTests();

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize correct values', () => {
    fixture.detectChanges();

    expect(component.container).toBeDefined();
    expect(component.interactions.raw).toHaveLength(0);
    expect(component.interactions.normalized).toHaveLength(0);
    expect(component.interactions.absolute).toHaveLength(0);

    expect(component.calibratedInteractions).toHaveLength(0);

    expect(component.fullScreen).toBe(false);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should update evenId', () => {
    fixture.detectChanges();

    expect(component.eventId).toBe(0);

    const evId = 1234;

    component.eventId = evId;

    expect(component.eventId).toEqual(evId);
  });

  it('should handle errors appropriately', () => {
    const errorFrameSize = 'TestError: calibrationService.getFrameSize';
    calibrationService.getFrameSize.mockReturnValue(throwError(errorFrameSize));

    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorFrameSize);
  });

  it('should update interactions', () => {
    fixture.detectChanges();

    expect(component.fullScreen).toBe(false);

    component.updateCalibratedInteractions(testInteractionData);

    expect(component.interactions).toEqual(testInteractionData);
    expect(component.calibratedInteractions).toEqual(
      testInteractionData.normalized
    );

    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    component.fullScreen = true;

    component.updateCalibratedInteractions(testInteractionData);

    expect(component.calibratedInteractions).toEqual(
      testInteractionData.absolute
    );
  });
});
