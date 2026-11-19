/* eslint-disable max-lines -- Keep all test scenarios for this component in one spec file. */
import { HttpResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { CalibrationTransform, DEFAULT_SETTINGS, FrameSizeDefinition, Interaction } from '@reflex/shared-types';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { queryElement } from '../../../../../../test/helpers/dom';
import { mockReturnValueForArgs } from '../../test-utils/mock-return-value-for-args';
import {
  calibration,
  mount,
  processing,
  setupTests as setupZonelessTests,
  text
} from '../test-utils/zoneless-change-detection.test-context';
import { frame, interaction, interactionData } from '../test-utils/zoneless-change-detection.test-data';
import { CalibrationComponent } from './calibration.component';
import { component as testComponent, fixture as testFixture, setupTests } from './calibration.component.test-context';
import {
  calibrationService,
  customFrame,
  defaultCalibrationMatrix,
  defaultFrame,
  defaultInteractionData,
  defaultSelectedInteraction,
  identityCalibrationMatrix,
  logService,
  processingService,
  settingsService,
  sourcePoints,
  targetPoints,
  testInteractionData
} from './calibration.component.test-data';

describe('Zoneless change detection: renders asynchronous calibration borders', () => {
  setupZonelessTests();

  it('renders asynchronous calibration borders', async () => {
    const response = new Subject<FrameSizeDefinition>();
    calibration.getFrameSize.mockReturnValue(response);
    const fixture = await mount(CalibrationComponent);
    response.next(frame);
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '#calibration-border-top').style
        .transform
    ).toBe('translateY(17px)');
  });
});

describe('Zoneless change detection: updates calibration enablement before the interaction stream emits', () => {
  setupZonelessTests();

  it('updates calibration enablement before the interaction stream emits', async () => {
    const response = new Subject<string>();
    processing.getStatus.mockReturnValue(response);
    const fixture = await mount(CalibrationComponent);
    response.next('Active');
    await fixture.whenStable();
    expect(
      queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#calibrations-interactions-toggle')
        .disabled
    ).toBe(false);
    response.next('Inactive');
    await fixture.whenStable();
    expect(
      queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#calibrations-interactions-toggle')
        .disabled
    ).toBe(true);
  });
});

describe('Zoneless change detection: renders calibrated interaction results after a live interaction arrives', () => {
  setupZonelessTests();

  it('renders calibrated interaction results after a live interaction arrives', async () => {
    processing.getStatus.mockReturnValue(of('Active'));
    const response = new Subject<Array<Interaction>>();
    processing.getInteractions.mockReturnValue(response);
    calibration.computeCalibratedAbsolutePosition.mockImplementation(() =>
      of(interactionData()));
    const fixture = await mount(CalibrationComponent);

    queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#calibrations-interactions-toggle')
      .click();
    await fixture.whenStable();
    response.next([structuredClone(interaction)]);
    await fixture.whenStable();
    expect(
      queryElement<HTMLSelectElement>((fixture.nativeElement as HTMLInputElement), 'input[title="select point"]')
    ).toBeTruthy();
    expect(text(fixture)).toContain('42');
  });
});

describe('CalibrationComponent', () => {
  setupTests();

  it('should create', () => {
    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(vi.spyOn(testComponent, 'submit')).not.toHaveBeenCalled();
  });

  it('should initialize values correctly', () => {
    calibrationService.getCalibrationMatrix.mockReturnValue(
      of(defaultCalibrationMatrix)
    );

    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();
    expect(testComponent.isInteractiveCalibrationVisible).toBe(false);

    expect(testComponent.borderOffset).toEqual([
      customFrame.top,
      customFrame.left,
      customFrame.top + customFrame.height,
      customFrame.left + customFrame.width
    ]);
    expect(testComponent.calibrationSource).toEqual(sourcePoints);
    expect(testComponent.calibratedTargets).toEqual(targetPoints);

    expect(testComponent.calibrationMatrix).toEqual(
      defaultCalibrationMatrix.transformation
    );

    expect(testComponent.interactions).toEqual([]);

    expect(testComponent['view']).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(vi.spyOn(testComponent, 'submit')).not.toHaveBeenCalled();

    expect(testComponent['maxConfidence']).toBe(30);
    expect(testComponent['maxConfidence']).toEqual(
      DEFAULT_SETTINGS.filterSettingValues.confidence.max
    );
  });

  it('should toggle CalibrationView', async () => {
    await await testFixture.whenStable();

    expect(testComponent.isInteractiveCalibrationVisible).toBe(false);

    const calib = testFixture.debugElement.query(By.css('.calibration__background'))
      .nativeElement as HTMLElement;
    expect(calib).toBeTruthy();
    expect(calib.style.visibility).toEqual('collapse');
    expect(calib.classList).not.toContain('fullScreen');


    queryElement<HTMLButtonElement>((testFixture.nativeElement as HTMLInputElement), '.calibration_buttons button')
      .click();

    expect(testComponent.isInteractiveCalibrationVisible).toBe(true);
    await testFixture.whenStable();

    expect(calib).toBeTruthy();
    expect(calib.style.visibility).toEqual('visible');
    expect(calib.classList).toContain('fullScreen');


    queryElement<HTMLButtonElement>((testFixture.nativeElement as HTMLInputElement), '.calibration_buttons button')
      .click();

    expect(testComponent.isInteractiveCalibrationVisible).toBe(false);
    await testFixture.whenStable();

    expect(calib).toBeTruthy();
    expect(calib.style.visibility).toEqual('collapse');
    expect(calib.classList).not.toContain('fullScreen');

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(vi.spyOn(testComponent, 'submit')).not.toHaveBeenCalled();
  });
});

describe('CalibrationComponent', () => {
  setupTests();

  it('should reset borders correctly', () => {
    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();

    expect(testComponent.borderOffset).toEqual([
      customFrame.top,
      customFrame.left,
      customFrame.top + customFrame.height,
      customFrame.left + customFrame.width
    ]);

    testComponent.resetBorders();

    expect(testComponent.borderOffset).toEqual(defaultFrame);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(vi.spyOn(testComponent, 'submit')).not.toHaveBeenCalled();
  });
});

describe('CalibrationComponent', () => {
  setupTests();

  it('should toggle between raw and calibrated interactions', async () => {
    const obs = new BehaviorSubject<Array<Interaction>>([]);

    processingService.getInteractions.mockReturnValue(obs);
    mockReturnValueForArgs(calibrationService.computeCalibratedAbsolutePosition, [testInteractionData.normalized], of(testInteractionData));
    mockReturnValueForArgs(calibrationService.computeCalibratedAbsolutePosition, [[]], of(defaultInteractionData));

    testFixture.detectChanges();

    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledTimes(1);
    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledWith([]);

    obs.next(testInteractionData.normalized);

    expect(testComponent).toBeTruthy();
    expect(testComponent.update).toBe(false);
    expect(testComponent.displayCalibratedInteractions).toBe(false);
    expect(testComponent.isProcessingActive).toBe(true);

    expect(testComponent.interactions).toEqual([]);
    expect(testComponent.calibratedInteractions).toEqual([]);

    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledTimes(2);
    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledWith(testInteractionData.normalized);

    testComponent.update = true;
    testFixture.detectChanges();

    obs.next(testInteractionData.normalized);

    expect(testComponent.update).toBe(true);
    expect(testComponent.displayCalibratedInteractions).toBe(false);
    expect(testComponent.isProcessingActive).toBe(true);

    await await testFixture.whenStable();

    expect(testComponent.interactions).toEqual(testInteractionData.raw);
    expect(testComponent.calibratedInteractions).toEqual(testInteractionData.raw);

    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledTimes(3);
    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledWith([]);
    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledWith(testInteractionData.normalized);

    testComponent.displayCalibratedInteractions = true;

    obs.next([]);

    expect(testComponent.interactions).toEqual([]);
    expect(testComponent.calibratedInteractions).toEqual([]);
    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledTimes(4);

    obs.next(testInteractionData.normalized);

    expect(testComponent.interactions).toEqual(testInteractionData.raw);
    expect(testComponent.calibratedInteractions).toEqual(
      testInteractionData.absolute
    );
    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledTimes(5);

    testComponent.update = false;
    testComponent.updateCalibrationToggle();

    expect(testComponent.displayCalibratedInteractions).toBe(false);
    expect(testComponent.interactions).toEqual([]);
    expect(testComponent.calibratedInteractions).toEqual([]);

    obs.next(testInteractionData.normalized);

    expect(testComponent.interactions).toEqual([]);
    expect(testComponent.calibratedInteractions).toEqual([]);

    expect(
      calibrationService.computeCalibratedAbsolutePosition
    ).toHaveBeenCalledTimes(6);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(vi.spyOn(testComponent, 'submit')).not.toHaveBeenCalled();
  });
});

describe('CalibrationComponent', () => {
  setupTests();

  it('should update focus borders correctly', () => {
    testFixture.detectChanges();

    vi.spyOn(testComponent, 'focusBorder');
    vi.spyOn(testComponent, 'releaseBorder');
    vi.spyOn(testComponent, 'releaseAllBorders');

    expect(vi.spyOn(testComponent, 'focusBorder')).not.toHaveBeenCalled();
    expect(vi.spyOn(testComponent, 'releaseBorder')).not.toHaveBeenCalled();
    expect(vi.spyOn(testComponent, 'releaseAllBorders')).not.toHaveBeenCalled();

    expect(testComponent['selectedBorderIndex']).toBe(-1);

    const background = testFixture.debugElement.query(
      By.css('.calibration__background')
    ).nativeElement as HTMLElement;

    const border0 = testFixture.debugElement.query(By.css('#calibration-border-top'))
      .nativeElement as HTMLElement;
    const border1 = testFixture.debugElement.query(By.css('#calibration-border-left'))
      .nativeElement as HTMLElement;
    const border2 = testFixture.debugElement.query(
      By.css('#calibration-border-bottom')
    ).nativeElement as HTMLElement;
    const border3 = testFixture.debugElement.query(
      By.css('#calibration-border-right')
    ).nativeElement as HTMLElement;

    expect(background).toBeTruthy();
    expect(border0).toBeTruthy();
    expect(border1).toBeTruthy();
    expect(border2).toBeTruthy();
    expect(border3).toBeTruthy();

    border0.dispatchEvent(new Event('mousedown'));

    expect(vi.spyOn(testComponent, 'focusBorder')).toHaveBeenCalledTimes(1);

    expect(vi.spyOn(testComponent, 'focusBorder')).toHaveBeenCalledWith(0);
    expect(testComponent['selectedBorderIndex']).toBe(0);

    border1.dispatchEvent(new Event('mousedown'));

    expect(vi.spyOn(testComponent, 'focusBorder')).toHaveBeenCalledTimes(2);
    expect(vi.spyOn(testComponent, 'focusBorder')).toHaveBeenCalledWith(1);
    expect(testComponent['selectedBorderIndex']).toBe(1);

    background.dispatchEvent(new Event('mouseup'));

    expect(vi.spyOn(testComponent, 'releaseAllBorders')).toHaveBeenCalledTimes(1);
    expect(testComponent['selectedBorderIndex']).toBe(-1);

    border3.dispatchEvent(new Event('mousedown'));
    expect(vi.spyOn(testComponent, 'focusBorder')).toHaveBeenCalledTimes(3);
    expect(vi.spyOn(testComponent, 'focusBorder')).toHaveBeenCalledWith(3);
    expect(testComponent['selectedBorderIndex']).toBe(3);

    border3.dispatchEvent(new Event('mouseup'));
    expect(vi.spyOn(testComponent, 'releaseBorder')).toHaveBeenCalledTimes(1);
    expect(vi.spyOn(testComponent, 'releaseBorder')).toHaveBeenCalledWith(3);
    expect(vi.spyOn(testComponent, 'releaseAllBorders')).toHaveBeenCalledTimes(1);
    expect(testComponent['selectedBorderIndex']).toBe(-1);

    border2.dispatchEvent(new Event('mousedown'));
    expect(vi.spyOn(testComponent, 'focusBorder')).toHaveBeenCalledTimes(4);
    expect(vi.spyOn(testComponent, 'focusBorder')).toHaveBeenCalledWith(2);
    expect(testComponent['selectedBorderIndex']).toBe(2);

    border3.dispatchEvent(new Event('mouseup'));
    expect(vi.spyOn(testComponent, 'releaseBorder')).toHaveBeenCalledTimes(2);
    expect(vi.spyOn(testComponent, 'releaseBorder')).not.toHaveBeenCalledWith(2);
    expect(vi.spyOn(testComponent, 'releaseAllBorders')).toHaveBeenCalledTimes(1);
    expect(testComponent['selectedBorderIndex']).toBe(2);

    border1.dispatchEvent(new Event('mouseleave'));
    expect(vi.spyOn(testComponent, 'releaseBorder')).toHaveBeenCalledTimes(3);
    expect(vi.spyOn(testComponent, 'releaseBorder')).toHaveBeenCalledWith(1);
    expect(vi.spyOn(testComponent, 'releaseBorder')).not.toHaveBeenCalledWith(2);
    expect(vi.spyOn(testComponent, 'releaseAllBorders')).toHaveBeenCalledTimes(1);
    expect(testComponent['selectedBorderIndex']).toBe(2);

    border2.dispatchEvent(new Event('mouseup'));
    expect(vi.spyOn(testComponent, 'releaseBorder')).toHaveBeenCalledTimes(4);
    expect(vi.spyOn(testComponent, 'releaseBorder')).toHaveBeenCalledWith(2);
    expect(vi.spyOn(testComponent, 'releaseAllBorders')).toHaveBeenCalledTimes(1);
    expect(testComponent['selectedBorderIndex']).toBe(-1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(vi.spyOn(testComponent, 'submit')).not.toHaveBeenCalled();
  });
});

function verifyBorderOffsetStage1(startValues: Array<number>): void {
  expect(testComponent['selectedBorderIndex']).toBe(-1);
  expect(testComponent.borderOffset).toEqual(startValues);
  testComponent.onmouseMove(
    new MouseEvent('mousemove', { movementX: 10, movementY: -15 })
  );
  expect(testComponent.borderOffset).toEqual(startValues);
  testComponent.focusBorder(4);
  expect(testComponent['selectedBorderIndex']).toBe(4);
  testComponent.onmouseMove(
    new MouseEvent('mousemove', { movementX: 10, movementY: -15 })
  );
  expect(testComponent.borderOffset).toEqual(startValues);
  testComponent.focusBorder(0);
  expect(testComponent['selectedBorderIndex']).toBe(0);
  testComponent.onmouseMove(
    new MouseEvent('mousemove', { movementX: 10, movementY: 0 })
  );
  expect(testComponent.borderOffset).toEqual(startValues);
  testComponent.onmouseMove(
    new MouseEvent('mousemove', {
      movementX: 10,
      movementY: 2 * -startValues[1]
    })
  );
  expect(testComponent.borderOffset[0]).toEqual(0);
  expect(testComponent.borderOffset[0]).not.toBeCloseTo(-startValues[1], 4);
  expect(testComponent.borderOffset[1]).toEqual(startValues[1]);
  expect(testComponent.borderOffset[2]).toEqual(startValues[2]);
}

function verifyBorderOffsetStage2(startValues: Array<number>): void {
  expect(testComponent.borderOffset[3]).toEqual(startValues[3]);
  testComponent.focusBorder(1);
  expect(testComponent['selectedBorderIndex']).toBe(1);
  testComponent.onmouseMove(
    new MouseEvent('mousemove', {
      movementX: -0.5 * startValues[1],
      movementY: 10000
    })
  );
  expect(testComponent.borderOffset[0]).toEqual(0);
  expect(testComponent.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
  expect(testComponent.borderOffset[2]).toEqual(startValues[2]);
  expect(testComponent.borderOffset[3]).toEqual(startValues[3]);
  testComponent.focusBorder(3);
  expect(testComponent['selectedBorderIndex']).toBe(3);
  testComponent.onmouseMove(
    new MouseEvent('mousemove', {
      movementX: -startValues[3] + (0.5 * startValues[1]) + 60,
      movementY: 10000
    })
  );
  expect(testComponent.borderOffset[0]).toEqual(0);
  expect(testComponent.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
  expect(testComponent.borderOffset[2]).toEqual(startValues[2]);
  expect(testComponent.borderOffset[3]).not.toBeCloseTo(
    (0.5 * startValues[1]) + 60,
    4
  );
  expect(testComponent.borderOffset[3]).toEqual(startValues[3]);
}

function verifyBorderOffsetStage3(startValues: Array<number>): void {
  testComponent.onmouseMove(
    new MouseEvent('mousemove', {
      movementX: -startValues[3] + (0.5 * startValues[1]) + 80,
      movementY: 10000
    })
  );
  expect(testComponent.borderOffset[0]).toEqual(0);
  expect(testComponent.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
  expect(testComponent.borderOffset[2]).toEqual(startValues[2]);
  expect(testComponent.borderOffset[3]).toBeCloseTo((0.5 * startValues[1]) + 80, 4);
  testComponent.focusBorder(0);
  expect(testComponent['selectedBorderIndex']).toBe(0);
  testComponent.onmouseMove(
    new MouseEvent('mousemove', { movementX: 10, movementY: startValues[0] })
  );
  expect(testComponent.borderOffset[0]).toEqual(startValues[0]);
  expect(testComponent.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
  expect(testComponent.borderOffset[2]).toEqual(startValues[2]);
  expect(testComponent.borderOffset[3]).toBeCloseTo((0.5 * startValues[1]) + 80, 4);
  testComponent.focusBorder(2);
  expect(testComponent['selectedBorderIndex']).toBe(2);
  testComponent.onmouseMove(
    new MouseEvent('mousemove', {
      movementX: 200,
      movementY: (-startValues[2] + startValues[0]) - 75
    })
  );
  expect(testComponent.borderOffset[0]).toEqual(startValues[0]);
}

function verifyBorderOffsetStage4(startValues: Array<number>): void {
  expect(testComponent.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
  expect(testComponent.borderOffset[2]).not.toBeCloseTo(startValues[0] - 75, 4);
  expect(testComponent.borderOffset[2]).toEqual(startValues[2]);
  expect(testComponent.borderOffset[3]).toBeCloseTo((0.5 * startValues[1]) + 80, 4);
  testComponent.onmouseMove(
    new MouseEvent('mousemove', {
      movementX: 200,
      movementY: -startValues[2] + startValues[0] + 75
    })
  );
  expect(testComponent.borderOffset[0]).toEqual(startValues[0]);
  expect(testComponent.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
  expect(testComponent.borderOffset[2]).toEqual(startValues[0] + 75);
  expect(testComponent.borderOffset[3]).toBeCloseTo((0.5 * startValues[1]) + 80, 4);
  testComponent.focusBorder(0);
  expect(testComponent['selectedBorderIndex']).toBe(0);
  testComponent.onmouseMove(
    new MouseEvent('mousemove', { movementX: 10, movementY: 200 })
  );
  expect(testComponent.borderOffset[0]).not.toBeCloseTo(startValues[0] + 200, 4);
  expect(testComponent.borderOffset[0]).toEqual(startValues[0]);
  expect(testComponent.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
  expect(testComponent.borderOffset[2]).toEqual(startValues[0] + 75);
  expect(testComponent.borderOffset[3]).toBeCloseTo((0.5 * startValues[1]) + 80, 4);
  expect(logService.sendErrorLog).not.toHaveBeenCalled();
  expect(vi.spyOn(testComponent, 'submit')).not.toHaveBeenCalled();
}

function verifyBorderOffsetScenario5(): void {
  testFixture.detectChanges();

  const startValues = [
    customFrame.top,
    customFrame.left,
    customFrame.top + customFrame.height,
    customFrame.left + customFrame.width
  ];

  verifyBorderOffsetStage1(startValues);

  verifyBorderOffsetStage2(startValues);

  verifyBorderOffsetStage3(startValues);

  verifyBorderOffsetStage4(startValues);
}


describe('CalibrationComponent', () => {
  setupTests();

  it('should update border offset correctly', verifyBorderOffsetScenario5);
});

describe('CalibrationComponent', () => {
  setupTests();

  it('should correctly submit borders to webservice', () => {
    testFixture.detectChanges();

    const startValues = [
      customFrame.top,
      customFrame.left,
      customFrame.top + customFrame.height,
      customFrame.left + customFrame.width
    ];

    const newTop = customFrame.top * 0.5;
    const newLeft = customFrame.left * 0.75;

    const newHeight = 1.5 * customFrame.height;
    const newWidth = 2 * customFrame.width;

    const newValues = [newTop, newLeft, newTop + newHeight, newLeft + newWidth];

    const def: FrameSizeDefinition = {
      width: newWidth,
      height: newHeight,
      left: newLeft,
      top: newTop
    };

    // return a modified frame to check if values are updated
    const responseDef: FrameSizeDefinition = {
      width: newWidth * 1.1,
      height: newHeight * 1.2,
      left: newLeft * 0.9,
      top: newTop * 0.8
    };

    expect(testComponent.borderOffset).toEqual(startValues);

    testComponent.borderOffset = newValues;

    mockReturnValueForArgs(calibrationService.updateFrameSize, [def], of(new HttpResponse({ body: responseDef })));

    testComponent.updateFrameSize();

    expect(calibrationService.updateFrameSize).toHaveBeenCalledTimes(1);

    expect(calibrationService.updateFrameSize).toHaveBeenCalledWith(def);

    expect(testComponent.borderOffset[0]).toBeCloseTo(newTop * 0.8, 4);
    expect(testComponent.borderOffset[1]).toBeCloseTo(newLeft * 0.9, 4);

    expect(testComponent.borderOffset[2]).toBeCloseTo(
      (newTop * 0.8) + (newHeight * 1.2),
      4
    );
    expect(testComponent.borderOffset[3]).toBeCloseTo(
      (newLeft * 0.9) + (newWidth * 1.1),
      4
    );

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});

describe('CalibrationComponent', () => {
  setupTests();

  it('should correctly handle errors when submitting frame to server', () => {
    testFixture.detectChanges();

    const startValues = [
      customFrame.top,
      customFrame.left,
      customFrame.top + customFrame.height,
      customFrame.left + customFrame.width
    ];

    expect(testComponent.borderOffset).toEqual(startValues);

    const errorFrameUpdate = 'Test Error: calibrationService.updateFrameSize';
    calibrationService.updateFrameSize.mockReturnValue(
      throwError(errorFrameUpdate)
    );

    testComponent.updateFrameSize();

    expect(calibrationService.updateFrameSize).toHaveBeenCalledTimes(1);

    expect(calibrationService.updateFrameSize).toHaveBeenCalledWith(
      customFrame
    );

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorFrameUpdate);
  });
});

async function verifySelectedInteractionStage1({ obs, reduced1, reduced1conv, reduced2, reduced2conv, reduced3, reduced3conv }: { obs: BehaviorSubject<Array<Interaction>>; reduced1: Array<Interaction>; reduced1conv: { raw: Array<Interaction>; normalized: Array<Interaction>; absolute: Array<Interaction> }; reduced2: Array<Interaction>; reduced2conv: { raw: Array<Interaction>; normalized: Array<Interaction>; absolute: Array<Interaction> }; reduced3: Array<Interaction>; reduced3conv: { raw: Array<Interaction>; normalized: Array<Interaction>; absolute: Array<Interaction> } }): Promise<void> {
  processingService.getInteractions.mockReturnValue(obs);
  mockReturnValueForArgs(calibrationService.computeCalibratedAbsolutePosition, [testInteractionData.normalized], of(testInteractionData));
  mockReturnValueForArgs(calibrationService.computeCalibratedAbsolutePosition, [reduced1], of(reduced1conv));
  mockReturnValueForArgs(calibrationService.computeCalibratedAbsolutePosition, [reduced2], of(reduced2conv));
  mockReturnValueForArgs(calibrationService.computeCalibratedAbsolutePosition, [reduced3], of(reduced3conv));
  testComponent.update = true;
  testFixture.detectChanges();
  expect(testComponent.update).toBe(true);
  expect(testComponent.displayCalibratedInteractions).toBe(false);
  expect(testComponent.isProcessingActive).toBe(true);
  await testFixture.whenStable();
  expect(testComponent.selectedIdx).toBe(-1);
  expect(testComponent.selectedValue).toHaveLength(3);
  expect(testComponent.selectedValue[0]).toEqual(defaultSelectedInteraction);
  expect(testComponent.selectedValue[1]).toEqual(defaultSelectedInteraction);
  expect(testComponent.selectedValue[2]).toEqual(defaultSelectedInteraction);
  expect(testComponent.interactions).toEqual([]);
  expect(testComponent.calibratedInteractions).toEqual([]);
  testComponent.display(0);
  obs.next(testInteractionData.normalized);
  expect(testComponent.interactions).toEqual(testInteractionData.raw);
  expect(testComponent.calibratedInteractions).toEqual(testInteractionData.raw);
}

function verifySelectedInteractionStage2(): void {
  expect(testComponent.selectedIdx).toBe(0);
  expect(
    testComponent.selectedValue[testComponent['currentlyActiveStage']]
  ).toBeDefined();
  expect(testComponent.selectedValue[testComponent['currentlyActiveStage']]).toEqual(
    testInteractionData.raw[0]
  );
  testComponent.select(0);
  expect(testComponent.selectedIdx).toBe(-1);
  expect(testComponent.selectedValue).toHaveLength(3);
  expect(testComponent.selectedValue[0]).toEqual(defaultSelectedInteraction);
  expect(testComponent.selectedValue[1]).toEqual(defaultSelectedInteraction);
  expect(testComponent.selectedValue[2]).toEqual(defaultSelectedInteraction);
  testComponent.select(2);
  expect(testComponent.selectedIdx).toBe(2);
  expect(
    testComponent.selectedValue[testComponent['currentlyActiveStage']]
  ).toBeDefined();
  expect(testComponent.selectedValue[testComponent['currentlyActiveStage']]).toEqual(
    testInteractionData.raw[2]
  );
  testComponent.select(3);
  expect(testComponent.selectedIdx).toBe(-1);
  expect(testComponent.selectedValue).toHaveLength(3);
  expect(testComponent.selectedValue[0]).toEqual(defaultSelectedInteraction);
  expect(testComponent.selectedValue[1]).toEqual(defaultSelectedInteraction);
}

function verifySelectedInteractionStage3(obs: BehaviorSubject<Array<Interaction>>, reduced1: Array<Interaction>): void {
  expect(testComponent.selectedValue[2]).toEqual(defaultSelectedInteraction);
  testComponent.select(1);
  expect(testComponent.selectedIdx).toBe(1);
  expect(
    testComponent.selectedValue[testComponent['currentlyActiveStage']]
  ).toBeDefined();
  expect(testComponent.selectedValue[testComponent['currentlyActiveStage']]).toEqual(
    testInteractionData.raw[1]
  );
  obs.next([]);
  expect(testComponent.selectedIdx).toBe(-1);
  expect(testComponent.selectedValue).toHaveLength(3);
  expect(testComponent.selectedValue[0]).toEqual(defaultSelectedInteraction);
  expect(testComponent.selectedValue[1]).toEqual(defaultSelectedInteraction);
  expect(testComponent.selectedValue[2]).toEqual(defaultSelectedInteraction);
  obs.next(testInteractionData.normalized);
  testComponent.select(1);
  expect(testComponent.selectedIdx).toBe(1);
  expect(
    testComponent.selectedValue[testComponent['currentlyActiveStage']]
  ).toBeDefined();
  expect(testComponent.selectedValue[testComponent['currentlyActiveStage']]).toEqual(
    testInteractionData.raw[1]
  );
  expect(testComponent.selectedValue[0].touchId).toBe(1);
  obs.next(reduced1);
}

function verifySelectedInteractionStage4(obs: BehaviorSubject<Array<Interaction>>, reduced2: Array<Interaction>, reduced3: Array<Interaction>): void {
  expect(testComponent.selectedIdx).toBe(0);
  expect(
    testComponent.selectedValue[testComponent['currentlyActiveStage']]
  ).toBeDefined();
  expect(testComponent.selectedValue[testComponent['currentlyActiveStage']]).toEqual(
    testInteractionData.raw[1]
  );
  obs.next(reduced2);
  expect(testComponent.selectedIdx).toBe(1);
  expect(
    testComponent.selectedValue[testComponent['currentlyActiveStage']]
  ).toBeDefined();
  expect(testComponent.selectedValue[testComponent['currentlyActiveStage']]).toEqual(
    testInteractionData.raw[1]
  );
  obs.next(reduced3);
  expect(testComponent.selectedIdx).toBe(0);
  expect(testComponent.selectedValue[testComponent['currentlyActiveStage']]).toEqual(
    testInteractionData.raw[0]
  );
  expect(logService.sendErrorLog).not.toHaveBeenCalled();
  expect(vi.spyOn(testComponent, 'submit')).not.toHaveBeenCalled();
  obs.complete();
}

async function verifySelectedInteractionScenario5(): Promise<void> {
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

  await verifySelectedInteractionStage1({ obs, reduced1, reduced1conv, reduced2, reduced2conv, reduced3, reduced3conv });

  verifySelectedInteractionStage2();

  verifySelectedInteractionStage3(obs, reduced1);

  verifySelectedInteractionStage4(obs, reduced2, reduced3);
}


describe('CalibrationComponent', () => {
  setupTests();

  it('should correctly update selected interaction', verifySelectedInteractionScenario5);
});

function verifySubmissionStage1({ calibPoint1, resp1, calibPoint2, resp2, calibPoint3, resp3, obs, calib1 }: { calibPoint1: { positionX: number; positionY: number; touchId: number }; resp1: HttpResponse<CalibrationTransform>; calibPoint2: { positionX: number; positionY: number; touchId: number }; resp2: HttpResponse<CalibrationTransform>; calibPoint3: { positionX: number; positionY: number; touchId: number }; resp3: HttpResponse<CalibrationTransform>; obs: BehaviorSubject<Array<Interaction>>; calib1: Array<Interaction> }): void {
  mockReturnValueForArgs(calibrationService.updateCalibrationPoint, [0, calibPoint1], of(resp1));
  mockReturnValueForArgs(calibrationService.updateCalibrationPoint, [1, calibPoint2], of(resp2));
  mockReturnValueForArgs(calibrationService.updateCalibrationPoint, [2, calibPoint3], of(resp3));
  testComponent.update = true;
  testFixture.detectChanges();
  expect(testComponent.update).toBe(true);
  expect(testComponent.displayCalibratedInteractions).toBe(false);
  expect(testComponent.isProcessingActive).toBe(true);
  expect(testComponent.selectedIdx).toBe(-1);
  expect(testComponent.selectedValue).toHaveLength(3);
  expect(testComponent.selectedValue[0]).toEqual(defaultSelectedInteraction);
  expect(testComponent.selectedValue[1]).toEqual(defaultSelectedInteraction);
  expect(testComponent.selectedValue[2]).toEqual(defaultSelectedInteraction);
  expect(testComponent['currentlyActiveStage']).toBe(-1);
  testComponent.display(0);
  obs.next(calib1);
  expect(testComponent['currentlyActiveStage']).toBe(0);
  testComponent.submit();
  testFixture.detectChanges();
  expect(testComponent['currentlyActiveStage']).toBe(1);
  expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledTimes(1);
}

function verifySubmissionStage2({ calibPoint1, mat1, obs, calib2, calibPoint2, mat2, calib3 }: { calibPoint1: { positionX: number; positionY: number; touchId: number }; mat1: CalibrationTransform; obs: BehaviorSubject<Array<Interaction>>; calib2: Array<Interaction>; calibPoint2: { positionX: number; positionY: number; touchId: number }; mat2: CalibrationTransform; calib3: Array<Interaction> }): void {
  expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledWith(
    0,
    calibPoint1
  );
  expect(testComponent.calibratedTargets[0]).toEqual(calibPoint1);
  expect(testComponent.calibrationMatrix).toEqual(mat1.transformation);
  calibrationService.updateCalibrationPoint.mockClear();
  obs.next(calib2);
  testComponent.submit();
  testFixture.detectChanges();
  expect(testComponent['currentlyActiveStage']).toBe(2);
  expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledTimes(1);
  expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledWith(
    1,
    calibPoint2
  );
  expect(testComponent.calibratedTargets[0]).toEqual(calibPoint1);
  expect(testComponent.calibratedTargets[1]).toEqual(calibPoint2);
  expect(testComponent.calibrationMatrix).toEqual(mat2.transformation);
  calibrationService.updateCalibrationPoint.mockClear();
  obs.next(calib3);
  testComponent.submit();
  testFixture.detectChanges();
  expect(testComponent['currentlyActiveStage']).toBe(-1);
  expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledTimes(1);
}

function verifySubmissionScenario3(): void {
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

  verifySubmissionStage1({ calibPoint1, resp1, calibPoint2, resp2, calibPoint3, resp3, obs, calib1 });

  verifySubmissionStage2({ calibPoint1, mat1, obs, calib2, calibPoint2, mat2, calib3 });

  expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledWith(
    2,
    calibPoint3
  );
  expect(testComponent.calibratedTargets[0]).toEqual(calibPoint1);
  expect(testComponent.calibratedTargets[1]).toEqual(calibPoint2);
  expect(testComponent.calibratedTargets[2]).toEqual(calibPoint3);
  expect(testComponent.calibrationMatrix).toEqual(mat3.transformation);
  calibrationService.updateCalibrationPoint.mockClear();
}


describe('CalibrationComponent', () => {
  setupTests();

  it('should correctly advance between stages when submitting manually', verifySubmissionScenario3);
});

function verifyConfidenceStage1({ calibPoint1, resp1, calibPoint2, resp2, calibPoint3, resp3, obs, calib1 }: { calibPoint1: { positionX: number; positionY: number; touchId: number }; resp1: HttpResponse<CalibrationTransform>; calibPoint2: { positionX: number; positionY: number; touchId: number }; resp2: HttpResponse<CalibrationTransform>; calibPoint3: { positionX: number; positionY: number; touchId: number }; resp3: HttpResponse<CalibrationTransform>; obs: BehaviorSubject<Array<Interaction>>; calib1: Array<Interaction> }): void {
  mockReturnValueForArgs(calibrationService.updateCalibrationPoint, [0, calibPoint1], of(resp1));
  mockReturnValueForArgs(calibrationService.updateCalibrationPoint, [1, calibPoint2], of(resp2));
  mockReturnValueForArgs(calibrationService.updateCalibrationPoint, [2, calibPoint3], of(resp3));
  testComponent.update = true;
  testFixture.detectChanges();
  expect(testComponent.update).toBe(true);
  expect(testComponent.displayCalibratedInteractions).toBe(false);
  expect(testComponent.isProcessingActive).toBe(true);
  expect(testComponent.selectedIdx).toBe(-1);
  expect(testComponent.selectedValue).toHaveLength(3);
  expect(testComponent.selectedValue[0]).toEqual(defaultSelectedInteraction);
  expect(testComponent.selectedValue[1]).toEqual(defaultSelectedInteraction);
  expect(testComponent.selectedValue[2]).toEqual(defaultSelectedInteraction);
  expect(testComponent['currentlyActiveStage']).toBe(-1);
  obs.next(calib1);
  testFixture.detectChanges();
  testComponent.display(0);
  expect(testComponent['currentlyActiveStage']).toBe(0);
  expect(testComponent.selectedIdx).toBe(0);
}

function verifyConfidenceStage2(calib1: Array<Interaction>, obs: BehaviorSubject<Array<Interaction>>, calibPoint1: { positionX: number; positionY: number; touchId: number }): void {
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

    testFixture.detectChanges();

    if (i < 30) {
      expect(testComponent['currentlyActiveStage']).toBe(0);
      expect(
        calibrationService.updateCalibrationPoint
      ).not.toHaveBeenCalled();
    } else {
      expect(testComponent['currentlyActiveStage']).toBe(1);
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

function verifyConfidenceScenario3(): void {
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

  verifyConfidenceStage1({ calibPoint1, resp1, calibPoint2, resp2, calibPoint3, resp3, obs, calib1 });

  verifyConfidenceStage2(calib1, obs, calibPoint1);
}


describe('CalibrationComponent', () => {
  setupTests();

  it('should correctly advance between stages when confidence value is high enough', verifyConfidenceScenario3);
});

function verifyInvalidSubmissionStage1(calibPoint1: { positionX: number; positionY: number; touchId: number }, resp1: HttpResponse<CalibrationTransform>, obs: BehaviorSubject<Array<Interaction>>, calib1: Array<Interaction>): void {
  mockReturnValueForArgs(calibrationService.updateCalibrationPoint, [0, calibPoint1], of(resp1));
  testComponent.update = true;
  testFixture.detectChanges();
  expect(testComponent.update).toBe(true);
  expect(testComponent.displayCalibratedInteractions).toBe(false);
  expect(testComponent.isProcessingActive).toBe(true);
  expect(testComponent.selectedIdx).toBe(-1);
  expect(testComponent.selectedValue).toHaveLength(3);
  expect(testComponent.selectedValue[0]).toEqual(defaultSelectedInteraction);
  expect(testComponent.selectedValue[1]).toEqual(defaultSelectedInteraction);
  expect(testComponent.selectedValue[2]).toEqual(defaultSelectedInteraction);
  expect(testComponent['currentlyActiveStage']).toBe(-1);
  testComponent.display(0);
  obs.next(calib1);
  expect(testComponent['currentlyActiveStage']).toBe(0);
  testComponent.submit();
  testFixture.detectChanges();
  expect(testComponent['currentlyActiveStage']).toBe(1);
  expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledTimes(1);
  expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledWith(
    0,
    calibPoint1
  );
  expect(testComponent.calibratedTargets[0]).toEqual(calibPoint1);
}

function verifyInvalidSubmissionStage2(mat1: CalibrationTransform, obs: BehaviorSubject<Array<Interaction>>, calib1: Array<Interaction>): void {
  expect(testComponent.calibrationMatrix).toEqual(mat1.transformation);
  calibrationService.updateCalibrationPoint.mockClear();
  testComponent.display(0);
  expect(testComponent['currentlyActiveStage']).toBe(0);
  obs.next(calib1);
  testComponent.select(0);
  expect(testComponent.selectedValue).toHaveLength(3);
  expect(testComponent.selectedValue[0]).toEqual(defaultSelectedInteraction);
  expect(testComponent.selectedValue[1]).toEqual(defaultSelectedInteraction);
  expect(testComponent.selectedValue[2]).toEqual(defaultSelectedInteraction);
  testComponent.submit();
  testFixture.detectChanges();
  expect(testComponent['currentlyActiveStage']).toBe(0);
  expect(calibrationService.updateCalibrationPoint).not.toHaveBeenCalled();
  testComponent.select(0);
  expect(testComponent.selectedValue[0]?.touchId).toBeDefined();
  testComponent.display(-1);
  expect(testComponent['currentlyActiveStage']).toBe(-1);
  expect(testComponent.selectedValue).toHaveLength(3);
  expect(testComponent.selectedValue[0]).toEqual(defaultSelectedInteraction);
  expect(testComponent.selectedValue[1]).toEqual(defaultSelectedInteraction);
  expect(testComponent.selectedValue[2]).toEqual(defaultSelectedInteraction);
}

function verifyInvalidSubmissionScenario3(): void {
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

  verifyInvalidSubmissionStage1(calibPoint1, resp1, obs, calib1);

  verifyInvalidSubmissionStage2(mat1, obs, calib1);

  testComponent.submit();
  expect(testComponent['currentlyActiveStage']).toBe(-1);
  expect(calibrationService.updateCalibrationPoint).not.toHaveBeenCalled();
}


describe('CalibrationComponent', () => {
  setupTests();

  it('not submit invalid values', verifyInvalidSubmissionScenario3);
});

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

    testComponent.update = true;
    testFixture.detectChanges();

    expect(testComponent.update).toBe(true);
    expect(testComponent.displayCalibratedInteractions).toBe(false);
    expect(testComponent.isProcessingActive).toBe(true);

    expect(testComponent.selectedIdx).toBe(-1);
    expect(testComponent.selectedValue).toHaveLength(3);
    expect(testComponent.selectedValue[0]).toEqual(defaultSelectedInteraction);
    expect(testComponent.selectedValue[1]).toEqual(defaultSelectedInteraction);
    expect(testComponent.selectedValue[2]).toEqual(defaultSelectedInteraction);

    expect(testComponent['currentlyActiveStage']).toBe(-1);

    testComponent.display(0);

    obs.next(calib1);

    expect(testComponent['currentlyActiveStage']).toBe(0);

    testComponent.submit();

    testFixture.detectChanges();

    expect(testComponent['currentlyActiveStage']).toBe(0);
    expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledTimes(1);
    expect(calibrationService.updateCalibrationPoint).toHaveBeenCalledWith(
      0,
      calibPoint1
    );

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(calibrationError);
    expect(testComponent.calibrationMatrix).toEqual(
      identityCalibrationMatrix.transformation
    );
  });
});

describe('CalibrationComponent', () => {
  setupTests();

  it('should not activate an invalid state', () => {
    testFixture.detectChanges();

    testComponent.display(0);

    expect(testComponent['currentlyActiveStage']).toBe(0);

    testComponent.display(-5);

    // negative values default to -1
    expect(testComponent['currentlyActiveStage']).toBe(-1);

    testComponent.display(2);

    expect(testComponent['currentlyActiveStage']).toBe(2);

    testComponent.display(1);

    expect(testComponent['currentlyActiveStage']).toBe(1);

    testComponent.display(4);

    // ignore switching higher than 2
    expect(testComponent['currentlyActiveStage']).toBe(1);
  });

  it('should correctly apply calibration', () => {
    const result = structuredClone<CalibrationTransform>(identityCalibrationMatrix);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result.transformation[i][j] = Math.floor((Math.random() * 100) + 1);
      }
    }

    calibrationService.applyCalibration.mockReturnValue(of(result));

    testComponent.display(1);
    expect(testComponent['currentlyActiveStage']).toBe(1);

    testComponent.applyCalibration();

    expect(testComponent.calibrationMatrix).toEqual(result.transformation);
    expect(testComponent['currentlyActiveStage']).toBe(-1);

    expect(calibrationService.applyCalibration).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    testComponent.display(1);
    expect(testComponent['currentlyActiveStage']).toBe(1);

    const errorApply = 'TestError: calibrationService.applyCalibration';
    calibrationService.applyCalibration.mockReturnValue(throwError(errorApply));

    testComponent.applyCalibration();

    expect(testComponent.calibrationMatrix).toEqual(result.transformation);
    expect(testComponent['currentlyActiveStage']).toBe(-1);

    expect(calibrationService.applyCalibration).toHaveBeenCalledTimes(2);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorApply);
  });
});

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

    expect(testComponent.calibrationMatrix).toEqual(
      identityCalibrationMatrix.transformation
    );

    testComponent.saveCalibration();

    expect(testComponent.calibrationMatrix).not.toEqual(result.transformation);
    expect(testComponent.calibrationMatrix).toEqual(
      identityCalibrationMatrix.transformation
    );

    expect(calibrationService.saveCalibration).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).not.toHaveBeenCalled();

    const errorSave = 'TestError: calibrationService.saveCalibration';
    calibrationService.saveCalibration.mockReturnValue(throwError(errorSave));

    testComponent.saveCalibration();

    expect(testComponent.calibrationMatrix).toEqual(
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

    testFixture.detectChanges();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(4);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
    // interactions are not queried, if status is false
    expect(logService.sendErrorLog).not.toHaveBeenCalledWith(errorInteractions);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSettings);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorCalibration);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorMatrix);

    expect(testComponent).toBeTruthy();
    expect(testComponent['view']).toBeTruthy();

    expect(vi.spyOn(testComponent, 'submit')).not.toHaveBeenCalled();
  });
});

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

    testFixture.detectChanges();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(6);

    // interactions are not queried, if status is false
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorInteractions);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSettings);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorCalibration);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorMatrix);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSource);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorTarget);

    expect(testComponent).toBeTruthy();
    expect(testComponent['view']).toBeTruthy();

    expect(vi.spyOn(testComponent, 'submit')).not.toHaveBeenCalled();
  });
});

describe('CalibrationComponent', () => {
  setupTests();

  it('should handle errors appropriately and initialize default values', () => {
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

    testFixture.detectChanges();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(6);

    // interactions are not queried, if status is false
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorInteractions);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSettings);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorCalibration);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorMatrix);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSource);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorTarget);

    expect(testComponent).toBeTruthy();
    expect(testComponent['view']).toBeTruthy();

    expect(testComponent.isInteractiveCalibrationVisible).toBe(false);

    expect(testComponent.borderOffset).toEqual(defaultFrame);
    expect(testComponent.calibrationSource).toBeDefined();
    expect(testComponent.calibrationSource).toHaveLength(3);
    expect(testComponent.calibratedTargets).toBeDefined();
    expect(testComponent.calibratedTargets).toHaveLength(3);

    expect(testComponent.calibrationMatrix).toEqual(
      identityCalibrationMatrix.transformation
    );

    expect(testComponent.interactions).toEqual([]);
    expect(testComponent.calibratedInteractions).toEqual([]);

    expect(vi.spyOn(testComponent, 'submit')).not.toHaveBeenCalled();
  });
});
