import { throwError } from 'rxjs';
import { component, fixture, setupTests } from './calibration.component.test-context';
import { calibrationService, logService, processingService, settingsService } from './calibration.component.test-data';

describe('CalibrationComponent', () => {
  setupTests();

  it('should handle errors appropriately and send logs: 2 - valid status', () => {
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

    const errorSource
      = 'TestError: calibrationService.getCalibrationSourcePoints';
    calibrationService.getCalibrationSourcePoints.mockReturnValue(
      throwError(errorSource)
    );

    const errorTarget
      = 'TestError: calibrationService.getCurrentCalibrationTargetPoints';
    calibrationService.getCurrentCalibrationTargetPoints.mockReturnValue(
      throwError(errorTarget)
    );

    fixture.detectChanges();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(6);

    // interactions are not queried, if status is false
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorInteractions);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSettings);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorCalibration);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorMatrix);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSource);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorTarget);

    expect(component).toBeTruthy();
    expect(component['view']).toBeTruthy();

    expect(vi.spyOn(component, 'submit')).not.toHaveBeenCalled();
  });
});
