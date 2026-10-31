import {
  CalibrationTransform
} from '@reflex/shared-types';
import { of, throwError } from 'rxjs';
import { component, fixture, setupTests } from './calibration.component.test-context';
import { calibrationService, identityCalibrationMatrix, logService, processingService, settingsService } from './calibration.component.test-data';

describe('CalibrationComponent', () => {
  setupTests();

  it('should correctly save calibration without changing local values', () => {
    const result = structuredClone<CalibrationTransform>(identityCalibrationMatrix);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result.transformation[i][j] = Math.floor((Math.random() * 100) + 1);
      }
    }

    calibrationService.saveCalibration.mockReturnValue(of(result));

    expect(component.calibrationMatrix).toEqual(
      identityCalibrationMatrix.transformation
    );

    component.saveCalibration();

    expect(component.calibrationMatrix).not.toEqual(result.transformation);
    expect(component.calibrationMatrix).toEqual(
      identityCalibrationMatrix.transformation
    );

    expect(calibrationService.saveCalibration).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    const errorSave = 'TestError: calibrationService.saveCalibration';
    calibrationService.saveCalibration.mockReturnValue(throwError(errorSave));

    component.saveCalibration();

    expect(component.calibrationMatrix).toEqual(
      identityCalibrationMatrix.transformation
    );

    expect(calibrationService.saveCalibration).toHaveBeenCalledTimes(2);

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSave);
  });

  it('should handle errors appropriately and send logs: 1 - invalid status', () => {
    const errorStatus = 'TestError: processingService.getStatus';
    processingService.getStatus.mockReturnValue(throwError(errorStatus));

    const errorInteractions = 'TestError: processingService.getInteractions';
    processingService.getInteractions.mockReturnValue(
      throwError(errorInteractions)
    );

    const errorSettings = 'TestError: settingsService.getSettings';
    settingsService.getSettings.mockReturnValue(throwError(errorSettings));

    const errorCalibration = 'TestError: calibrationService.getFrameSize';
    calibrationService.getFrameSize.mockReturnValue(
      throwError(errorCalibration)
    );

    const errorMatrix = 'TestError: calibrationService.getCalibrationMatrix';
    calibrationService.getCalibrationMatrix.mockReturnValue(
      throwError(errorMatrix)
    );

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

    expect(vi.spyOn(component, 'submit')).not.toHaveBeenCalled();
  });
});
