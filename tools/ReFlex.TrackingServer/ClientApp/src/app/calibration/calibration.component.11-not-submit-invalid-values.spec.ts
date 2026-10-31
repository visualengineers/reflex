import {
  HttpResponse
} from '@angular/common/http';
import {
  CalibrationTransform,
  Interaction
} from '@reflex/shared-types';
import { BehaviorSubject, of } from 'rxjs';
import { mockReturnValueForArgs } from '../../test-utils/mock-return-value-for-args';
import { component, fixture, setupTests } from './calibration.component.test-context';
import { calibrationService, defaultSelectedInteraction, identityCalibrationMatrix, processingService, testInteractionData } from './calibration.component.test-data';


function verifyStage1(calibPoint1: { positionX: number; positionY: number; touchId: number }, resp1: HttpResponse<CalibrationTransform>, obs: BehaviorSubject<Array<Interaction>>, calib1: Array<Interaction>): void {
  mockReturnValueForArgs(calibrationService.updateCalibrationPoint, [0, calibPoint1], of(resp1));
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
  expect(component['currentlyActiveStage']).toBe(1);
  expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledTimes(1);
  expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledWith(
    0,
    calibPoint1
  );
  expect(component.calibratedTargets[0]).toEqual(calibPoint1);
}

function verifyStage2(mat1: CalibrationTransform, obs: BehaviorSubject<Array<Interaction>>, calib1: Array<Interaction>): void {
  expect(component.calibrationMatrix).toEqual(mat1.transformation);
  calibrationService.updateCalibrationPoint.mockClear();
  component.display(0);
  expect(component['currentlyActiveStage']).toBe(0);
  obs.next(calib1);
  component.select(0);
  expect(component.selectedValue).toHaveLength(3);
  expect(component.selectedValue[0]).toEqual(defaultSelectedInteraction);
  expect(component.selectedValue[1]).toEqual(defaultSelectedInteraction);
  expect(component.selectedValue[2]).toEqual(defaultSelectedInteraction);
  component.submit();
  fixture.detectChanges();
  expect(component['currentlyActiveStage']).toBe(0);
  expect(calibrationService.updateCalibrationPoint).not.toHaveBeenCalled();
  component.select(0);
  expect(component.selectedValue[0]?.touchId).toBeDefined();
  component.display(-1);
  expect(component['currentlyActiveStage']).toBe(-1);
  expect(component.selectedValue).toHaveLength(3);
  expect(component.selectedValue[0]).toEqual(defaultSelectedInteraction);
  expect(component.selectedValue[1]).toEqual(defaultSelectedInteraction);
  expect(component.selectedValue[2]).toEqual(defaultSelectedInteraction);
}

function verifyScenario3(): void {
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

  const mat1 = structuredClone(identityCalibrationMatrix);

  mat1.transformation[0][0] = 2;
  mat1.transformation[1][1] = 2;
  mat1.transformation[2][2] = 2;

  const resp1 = new HttpResponse<CalibrationTransform>({ body: mat1 });

  verifyStage1(calibPoint1, resp1, obs, calib1);

  verifyStage2(mat1, obs, calib1);

  component.submit();
  expect(component['currentlyActiveStage']).toBe(-1);
  expect(calibrationService.updateCalibrationPoint).not.toHaveBeenCalled();
}


describe('CalibrationComponent', () => {
  setupTests();

  it('not submit invalid values', verifyScenario3);
});
