import {
  Interaction
} from '@reflex/shared-types';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { mockReturnValueForArgs } from '../../test-utils/mock-return-value-for-args';
import { component, fixture, setupTests } from './calibration.component.test-context';
import { calibrationService, defaultSelectedInteraction, identityCalibrationMatrix, logService, processingService, testInteractionData } from './calibration.component.test-data';

describe('CalibrationComponent', () => {
  setupTests();

  it('handle errors during calibration correctly', () => {
    const obs = new BehaviorSubject<Array<Interaction>>([]);

    const calib1 = [testInteractionData.normalized[0]];

    const calib1conv = {
      raw: [testInteractionData.raw[0]],
      normalized: [testInteractionData.normalized[0]],
      absolute: [testInteractionData.absolute[0]]
    };

    const calibPoint1 = {
      positionX: calib1conv.raw[0].position.x,
      positionY: calib1conv.raw[0].position.y,
      touchId: 0
    };

    processingService.getInteractions.mockReturnValue(obs);
    mockReturnValueForArgs(calibrationService.computeCalibratedAbsolutePosition, [calib1], of(calib1conv));

    const calibrationError
      = 'Test Error: calibrationService.updateCalibrationPoint';
    mockReturnValueForArgs(calibrationService.updateCalibrationPoint, [0, calibPoint1], throwError(calibrationError));

    component.update = true;
    fixture.detectChanges();

    expect(component.update).toBe(true);
    expect(component.displayCalibratedInteractions).toBe(false);
    expect(component.isProcessingActive).toBe(true);

    expect(component.selectedIdx).toBe(-1);
    expect(component.selectedValue).toHaveLength(3);
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
    expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledTimes(1);
    expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledWith(
      0,
      calibPoint1
    );

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(calibrationError);
    expect(component.calibrationMatrix).toEqual(
      identityCalibrationMatrix.transformation
    );
  });
});
