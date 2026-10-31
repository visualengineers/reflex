import {
  Interaction
} from '@reflex/shared-types';
import { BehaviorSubject, of } from 'rxjs';
import { mockReturnValueForArgs } from '../../test-utils/mock-return-value-for-args';
import { component, fixture, setupTests } from './calibration.component.test-context';
import { calibrationService, defaultSelectedInteraction, logService, processingService, testInteractionData } from './calibration.component.test-data';


async function verifyStage1({ obs, reduced1, reduced1conv, reduced2, reduced2conv, reduced3, reduced3conv }: { obs: BehaviorSubject<Array<Interaction>>; reduced1: Array<Interaction>; reduced1conv: { raw: Array<Interaction>; normalized: Array<Interaction>; absolute: Array<Interaction> }; reduced2: Array<Interaction>; reduced2conv: { raw: Array<Interaction>; normalized: Array<Interaction>; absolute: Array<Interaction> }; reduced3: Array<Interaction>; reduced3conv: { raw: Array<Interaction>; normalized: Array<Interaction>; absolute: Array<Interaction> } }): Promise<void> {
  processingService.getInteractions.mockReturnValue(obs);
  mockReturnValueForArgs(calibrationService.computeCalibratedAbsolutePosition, [testInteractionData.normalized], of(testInteractionData));
  mockReturnValueForArgs(calibrationService.computeCalibratedAbsolutePosition, [reduced1], of(reduced1conv));
  mockReturnValueForArgs(calibrationService.computeCalibratedAbsolutePosition, [reduced2], of(reduced2conv));
  mockReturnValueForArgs(calibrationService.computeCalibratedAbsolutePosition, [reduced3], of(reduced3conv));
  component.update = true;
  fixture.detectChanges();
  expect(component.update).toBe(true);
  expect(component.displayCalibratedInteractions).toBe(false);
  expect(component.isProcessingActive).toBe(true);
  await fixture.whenStable();
  expect(component.selectedIdx).toBe(-1);
  expect(component.selectedValue).toHaveLength(3);
  expect(component.selectedValue[0]).toEqual(defaultSelectedInteraction);
  expect(component.selectedValue[1]).toEqual(defaultSelectedInteraction);
  expect(component.selectedValue[2]).toEqual(defaultSelectedInteraction);
  expect(component.interactions).toEqual([]);
  expect(component.calibratedInteractions).toEqual([]);
  component.display(0);
  obs.next(testInteractionData.normalized);
  expect(component.interactions).toEqual(testInteractionData.raw);
  expect(component.calibratedInteractions).toEqual(testInteractionData.raw);
}

function verifyStage2(): void {
  expect(component.selectedIdx).toBe(0);
  expect(
    component.selectedValue[component['currentlyActiveStage']]
  ).toBeDefined();
  expect(component.selectedValue[component['currentlyActiveStage']]).toEqual(
    testInteractionData.raw[0]
  );
  component.select(0);
  expect(component.selectedIdx).toBe(-1);
  expect(component.selectedValue).toHaveLength(3);
  expect(component.selectedValue[0]).toEqual(defaultSelectedInteraction);
  expect(component.selectedValue[1]).toEqual(defaultSelectedInteraction);
  expect(component.selectedValue[2]).toEqual(defaultSelectedInteraction);
  component.select(2);
  expect(component.selectedIdx).toBe(2);
  expect(
    component.selectedValue[component['currentlyActiveStage']]
  ).toBeDefined();
  expect(component.selectedValue[component['currentlyActiveStage']]).toEqual(
    testInteractionData.raw[2]
  );
  component.select(3);
  expect(component.selectedIdx).toBe(-1);
  expect(component.selectedValue).toHaveLength(3);
  expect(component.selectedValue[0]).toEqual(defaultSelectedInteraction);
  expect(component.selectedValue[1]).toEqual(defaultSelectedInteraction);
}

function verifyStage3(obs: BehaviorSubject<Array<Interaction>>, reduced1: Array<Interaction>): void {
  expect(component.selectedValue[2]).toEqual(defaultSelectedInteraction);
  component.select(1);
  expect(component.selectedIdx).toBe(1);
  expect(
    component.selectedValue[component['currentlyActiveStage']]
  ).toBeDefined();
  expect(component.selectedValue[component['currentlyActiveStage']]).toEqual(
    testInteractionData.raw[1]
  );
  obs.next([]);
  expect(component.selectedIdx).toBe(-1);
  expect(component.selectedValue).toHaveLength(3);
  expect(component.selectedValue[0]).toEqual(defaultSelectedInteraction);
  expect(component.selectedValue[1]).toEqual(defaultSelectedInteraction);
  expect(component.selectedValue[2]).toEqual(defaultSelectedInteraction);
  obs.next(testInteractionData.normalized);
  component.select(1);
  expect(component.selectedIdx).toBe(1);
  expect(
    component.selectedValue[component['currentlyActiveStage']]
  ).toBeDefined();
  expect(component.selectedValue[component['currentlyActiveStage']]).toEqual(
    testInteractionData.raw[1]
  );
  expect(component.selectedValue[0].touchId).toBe(1);
  obs.next(reduced1);
}

function verifyStage4(obs: BehaviorSubject<Array<Interaction>>, reduced2: Array<Interaction>, reduced3: Array<Interaction>): void {
  expect(component.selectedIdx).toBe(0);
  expect(
    component.selectedValue[component['currentlyActiveStage']]
  ).toBeDefined();
  expect(component.selectedValue[component['currentlyActiveStage']]).toEqual(
    testInteractionData.raw[1]
  );
  obs.next(reduced2);
  expect(component.selectedIdx).toBe(1);
  expect(
    component.selectedValue[component['currentlyActiveStage']]
  ).toBeDefined();
  expect(component.selectedValue[component['currentlyActiveStage']]).toEqual(
    testInteractionData.raw[1]
  );
  obs.next(reduced3);
  expect(component.selectedIdx).toBe(0);
  expect(component.selectedValue[component['currentlyActiveStage']]).toEqual(
    testInteractionData.raw[0]
  );
  expect(logService.sendErrorLog).not.toHaveBeenCalled();
  expect(vi.spyOn(component, 'submit')).not.toHaveBeenCalled();
  obs.complete();
}

async function verifyScenario5(): Promise<void> {
  const obs = new BehaviorSubject<Array<Interaction>>([]);

  const reduced1 = [
    testInteractionData.normalized[1],
    testInteractionData.normalized[0]
  ];

  const reduced2 = [
    testInteractionData.normalized[0],
    testInteractionData.normalized[1]
  ];

  const reduced3 = [testInteractionData.normalized[0]];

  const reduced1conv = {
    raw: [testInteractionData.raw[1], testInteractionData.raw[0]],
    normalized: [
      testInteractionData.normalized[1],
      testInteractionData.normalized[0]
    ],
    absolute: [
      testInteractionData.absolute[1],
      testInteractionData.absolute[0]
    ]
  };

  const reduced2conv = {
    raw: [testInteractionData.raw[0], testInteractionData.raw[1]],
    normalized: [
      testInteractionData.normalized[0],
      testInteractionData.normalized[1]
    ],
    absolute: [
      testInteractionData.absolute[0],
      testInteractionData.absolute[1]
    ]
  };

  const reduced3conv = {
    raw: [testInteractionData.raw[0]],
    normalized: [testInteractionData.normalized[0]],
    absolute: [testInteractionData.absolute[0]]
  };

  await verifyStage1({ obs, reduced1, reduced1conv, reduced2, reduced2conv, reduced3, reduced3conv });

  verifyStage2();

  verifyStage3(obs, reduced1);

  verifyStage4(obs, reduced2, reduced3);
}


describe('CalibrationComponent', () => {
  setupTests();

  it('should correctly update selected interaction', verifyScenario5);
});
