import { throwError } from 'rxjs';
import { component, fixture, setupTests } from './calibration.component.test-context';
import { calibrationService, customFrame, logService } from './calibration.component.test-data';

describe('CalibrationComponent', () => {
  setupTests();

  it('should correctly handle errors when submitting frame to server', () => {
    fixture.detectChanges();

    const startValues = [
      customFrame.top,
      customFrame.left,
      customFrame.top + customFrame.height,
      customFrame.left + customFrame.width
    ];

    expect(component.borderOffset).toEqual(startValues);

    const errorFrameUpdate = 'Test Error: calibrationService.updateFrameSize';
    calibrationService.updateFrameSize.mockReturnValue(
      throwError(errorFrameUpdate)
    );

    component.updateFrameSize();

    expect(calibrationService.updateFrameSize).toHaveBeenCalledTimes(1);

    expect(calibrationService.updateFrameSize).toHaveBeenCalledWith(
      customFrame
    );

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorFrameUpdate);
  });
});
