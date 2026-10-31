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


function verifyStage1({ calibPoint1, resp1, calibPoint2, resp2, calibPoint3, resp3, obs, calib1 }: { calibPoint1: { positionX: number; positionY: number; touchId: number }; resp1: HttpResponse<CalibrationTransform>; calibPoint2: { positionX: number; positionY: number; touchId: number }; resp2: HttpResponse<CalibrationTransform>; calibPoint3: { positionX: number; positionY: number; touchId: number }; resp3: HttpResponse<CalibrationTransform>; obs: BehaviorSubject<Array<Interaction>>; calib1: Array<Interaction> }): void {
  mockReturnValueForArgs(calibrationService.updateCalibrationPoint, [0, calibPoint1], of(resp1));
  mockReturnValueForArgs(calibrationService.updateCalibrationPoint, [1, calibPoint2], of(resp2));
  mockReturnValueForArgs(calibrationService.updateCalibrationPoint, [2, calibPoint3], of(resp3));
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
  obs.next(calib1);
  fixture.detectChanges();
  component.display(0);
  expect(component['currentlyActiveStage']).toBe(0);
  expect(component.selectedIdx).toBe(0);
}

function verifyStage2(calib1: Array<Interaction>, obs: BehaviorSubject<Array<Interaction>>, calibPoint1: { positionX: number; positionY: number; touchId: number }): void {
  for (let i = 0; i < 100; i++) {
    const updated = structuredClone(calib1);
    updated[0].confidence = i;

    const updatedconv = {
      raw: [structuredClone(testInteractionData.raw[0])],
      normalized: [structuredClone(testInteractionData.normalized[0])],
      absolute: [structuredClone(testInteractionData.absolute[0])]
    };

    updatedconv.raw[0].confidence = i;
    updatedconv.normalized[0].confidence = i;
    updatedconv.absolute[0].confidence = i;

    mockReturnValueForArgs(calibrationService.computeCalibratedAbsolutePosition, [updated], of(updatedconv));

    obs.next(updated);

    fixture.detectChanges();

    if (i < 30) {
      expect(component['currentlyActiveStage']).toBe(0);
      expect(
        calibrationService.updateCalibrationPoint
      ).not.toHaveBeenCalled();
    } else {
      expect(component['currentlyActiveStage']).toBe(1);
      expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledTimes(
        1
      );
      expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledWith(
        0,
        calibPoint1
      );
    }
  }
}

function verifyScenario3(): void {
  const obs = new BehaviorSubject<Array<Interaction>>([]);

  const calib1 = [testInteractionData.normalized[0]];

  const calib2 = [testInteractionData.normalized[1]];

  const calib3 = [testInteractionData.normalized[2]];

  const calib1conv = {
    raw: [testInteractionData.raw[0]],
    normalized: [testInteractionData.normalized[0]],
    absolute: [testInteractionData.absolute[0]]
  };

  const calib2conv = {
    raw: [testInteractionData.raw[1]],
    normalized: [testInteractionData.normalized[1]],
    absolute: [testInteractionData.absolute[1]]
  };

  const calib3conv = {
    raw: [testInteractionData.raw[2]],
    normalized: [testInteractionData.normalized[2]],
    absolute: [testInteractionData.absolute[2]]
  };

  const calibPoint1 = {
    positionX: calib1conv.raw[0].position.x,
    positionY: calib1conv.raw[0].position.y,
    touchId: 0
  };

  const calibPoint2 = {
    positionX: calib2conv.raw[0].position.x,
    positionY: calib2conv.raw[0].position.y,
    touchId: 1
  };

  const calibPoint3 = {
    positionX: calib3conv.raw[0].position.x,
    positionY: calib3conv.raw[0].position.y,
    touchId: 2
  };

  processingService.getInteractions.mockReturnValue(obs);
  mockReturnValueForArgs(calibrationService.computeCalibratedAbsolutePosition, [calib1], of(calib1conv));
  mockReturnValueForArgs(calibrationService.computeCalibratedAbsolutePosition, [calib2], of(calib2conv));
  mockReturnValueForArgs(calibrationService.computeCalibratedAbsolutePosition, [calib3], of(calib3conv));

  const mat1 = structuredClone(identityCalibrationMatrix);

  mat1.transformation[0][0] = 2;
  mat1.transformation[1][1] = 2;
  mat1.transformation[2][2] = 2;

  const mat2 = structuredClone(identityCalibrationMatrix);

  mat2.transformation[1][0] = 3;
  mat2.transformation[2][1] = 3;
  mat2.transformation[3][2] = 3;

  const mat3 = structuredClone(identityCalibrationMatrix);

  mat3.transformation[3][0] = 4;
  mat3.transformation[3][1] = 4;
  mat3.transformation[3][2] = 4;

  const resp1 = new HttpResponse<CalibrationTransform>({ body: mat1 });

  const resp2 = new HttpResponse<CalibrationTransform>({ body: mat2 });

  const resp3 = new HttpResponse<CalibrationTransform>({ body: mat3 });

  verifyStage1({ calibPoint1, resp1, calibPoint2, resp2, calibPoint3, resp3, obs, calib1 });

  verifyStage2(calib1, obs, calibPoint1);
}


describe('CalibrationComponent', () => {
  setupTests();

  it('should correctly advance between stages when confidence value is high enough', verifyScenario3);
});
