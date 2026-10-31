import {
  Interaction
} from '@reflex/shared-types';
import { BehaviorSubject, of } from 'rxjs';
import { mockReturnValueForArgs } from '../../test-utils/mock-return-value-for-args';
import { component, fixture, setupTests } from './calibration.component.test-context';
import { calibrationService, defaultInteractionData, logService, processingService, testInteractionData } from './calibration.component.test-data';

describe('CalibrationComponent', () => {
  setupTests();

  it('should toggle between raw and calibrated interactions', async () => {
    const obs = new BehaviorSubject<Array<Interaction>>([]);

    processingService.getInteractions.mockReturnValue(obs);
    mockReturnValueForArgs(calibrationService.computeCalibratedAbsolutePosition, [testInteractionData.normalized], of(testInteractionData));
    mockReturnValueForArgs(calibrationService.computeCalibratedAbsolutePosition, [[]], of(defaultInteractionData));

    fixture.detectChanges();

    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledTimes(1);
    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledWith([]);

    obs.next(testInteractionData.normalized);

    expect(component).toBeTruthy();
    expect(component.update).toBe(false);
    expect(component.displayCalibratedInteractions).toBe(false);
    expect(component.isProcessingActive).toBe(true);

    expect(component.interactions).toEqual([]);
    expect(component.calibratedInteractions).toEqual([]);

    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledTimes(2);
    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledWith(testInteractionData.normalized);

    component.update = true;
    fixture.detectChanges();

    obs.next(testInteractionData.normalized);

    expect(component.update).toBe(true);
    expect(component.displayCalibratedInteractions).toBe(false);
    expect(component.isProcessingActive).toBe(true);

    await await fixture.whenStable();

    expect(component.interactions).toEqual(testInteractionData.raw);
    expect(component.calibratedInteractions).toEqual(testInteractionData.raw);

    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledTimes(3);
    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledWith([]);
    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledWith(testInteractionData.normalized);

    component.displayCalibratedInteractions = true;

    obs.next([]);

    expect(component.interactions).toEqual([]);
    expect(component.calibratedInteractions).toEqual([]);
    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledTimes(4);

    obs.next(testInteractionData.normalized);

    expect(component.interactions).toEqual(testInteractionData.raw);
    expect(component.calibratedInteractions).toEqual(
      testInteractionData.absolute
    );
    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledTimes(5);

    component.update = false;
    component.updateCalibrationToggle();

    expect(component.displayCalibratedInteractions).toBe(false);
    expect(component.interactions).toEqual([]);
    expect(component.calibratedInteractions).toEqual([]);

    obs.next(testInteractionData.normalized);

    expect(component.interactions).toEqual([]);
    expect(component.calibratedInteractions).toEqual([]);

    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledTimes(6);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(vi.spyOn(component, 'submit')).not.toHaveBeenCalled();
  });
});
