import {
  CalibrationTransform
} from '@reflex/shared-types';
import { of, throwError } from 'rxjs';
import { component, fixture, setupTests } from './calibration.component.test-context';
import { calibrationService, identityCalibrationMatrix, logService } from './calibration.component.test-data';

describe('CalibrationComponent', () => {
  setupTests();

  it('should not activate an invalid state', () => {
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

  it('should correctly apply calibration', () => {
    const result = structuredClone<CalibrationTransform>(identityCalibrationMatrix);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result.transformation[i][j] = Math.floor((Math.random() * 100) + 1);
      }
    }

    calibrationService.applyCalibration.mockReturnValue(of(result));

    component.display(1);
    expect(component['currentlyActiveStage']).toBe(1);

    component.applyCalibration();

    expect(component.calibrationMatrix).toEqual(result.transformation);
    expect(component['currentlyActiveStage']).toBe(-1);

    expect(calibrationService.applyCalibration).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    component.display(1);
    expect(component['currentlyActiveStage']).toBe(1);

    const errorApply = 'TestError: calibrationService.applyCalibration';
    calibrationService.applyCalibration.mockReturnValue(throwError(errorApply));

    component.applyCalibration();

    expect(component.calibrationMatrix).toEqual(result.transformation);
    expect(component['currentlyActiveStage']).toBe(-1);

    expect(calibrationService.applyCalibration).toHaveBeenCalledTimes(2);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorApply);
  });
});
