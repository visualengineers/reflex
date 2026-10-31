import { By } from '@angular/platform-browser';
import {
  DEFAULT_SETTINGS
} from '@reflex/shared-types';
import { of } from 'rxjs';
import { queryElement } from '../../../../../../test/helpers/dom';
import { component, fixture, setupTests } from './calibration.component.test-context';
import { calibrationService, customFrame, defaultCalibrationMatrix, logService, sourcePoints, targetPoints } from './calibration.component.test-data';

describe('CalibrationComponent', () => {
  setupTests();

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(vi.spyOn(component, 'submit')).not.toHaveBeenCalled();
  });

  it('should initialize values correctly', () => {
    calibrationService.getCalibrationMatrix.mockReturnValue(
      of(defaultCalibrationMatrix)
    );

    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.isInteractiveCalibrationVisible).toBe(false);

    expect(component.borderOffset).toEqual([
      customFrame.top,
      customFrame.left,
      customFrame.top + customFrame.height,
      customFrame.left + customFrame.width
    ]);
    expect(component.calibrationSource).toEqual(sourcePoints);
    expect(component.calibratedTargets).toEqual(targetPoints);

    expect(component.calibrationMatrix).toEqual(
      defaultCalibrationMatrix.transformation
    );

    expect(component.interactions).toEqual([]);

    expect(component['view']).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(vi.spyOn(component, 'submit')).not.toHaveBeenCalled();

    expect(component['maxConfidence']).toBe(30);
    expect(component['maxConfidence']).toEqual(
      DEFAULT_SETTINGS.filterSettingValues.confidence.max
    );
  });

  it('should toggle CalibrationView', async () => {
    await await fixture.whenStable();

    expect(component.isInteractiveCalibrationVisible).toBe(false);

    const calib = fixture.debugElement.query(By.css('.calibration__background'))
      .nativeElement as HTMLElement;
    expect(calib).toBeTruthy();
    expect(calib.style.visibility).toEqual('collapse');
    expect(calib.classList).not.toContain('fullScreen');


    queryElement<HTMLButtonElement>((fixture.nativeElement as HTMLInputElement), '.calibration_buttons button')
      .click();

    expect(component.isInteractiveCalibrationVisible).toBe(true);
    await fixture.whenStable();

    expect(calib).toBeTruthy();
    expect(calib.style.visibility).toEqual('visible');
    expect(calib.classList).toContain('fullScreen');


    queryElement<HTMLButtonElement>((fixture.nativeElement as HTMLInputElement), '.calibration_buttons button')
      .click();

    expect(component.isInteractiveCalibrationVisible).toBe(false);
    await fixture.whenStable();

    expect(calib).toBeTruthy();
    expect(calib.style.visibility).toEqual('collapse');
    expect(calib.classList).not.toContain('fullScreen');

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(vi.spyOn(component, 'submit')).not.toHaveBeenCalled();
  });
});
