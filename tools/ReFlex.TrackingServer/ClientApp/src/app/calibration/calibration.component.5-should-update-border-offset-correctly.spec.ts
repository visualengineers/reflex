import { component, fixture, setupTests } from './calibration.component.test-context';
import { customFrame, logService } from './calibration.component.test-data';


function verifyStage1(startValues: Array<number>): void {
  expect(component['selectedBorderIndex']).toBe(-1);
  expect(component.borderOffset).toEqual(startValues);
  component.onmouseMove(
    new MouseEvent('mousemove', { movementX: 10, movementY: -15 })
  );
  expect(component.borderOffset).toEqual(startValues);
  component.focusBorder(4);
  expect(component['selectedBorderIndex']).toBe(4);
  component.onmouseMove(
    new MouseEvent('mousemove', { movementX: 10, movementY: -15 })
  );
  expect(component.borderOffset).toEqual(startValues);
  component.focusBorder(0);
  expect(component['selectedBorderIndex']).toBe(0);
  component.onmouseMove(
    new MouseEvent('mousemove', { movementX: 10, movementY: 0 })
  );
  expect(component.borderOffset).toEqual(startValues);
  component.onmouseMove(
    new MouseEvent('mousemove', {
      movementX: 10,
      movementY: 2 * -startValues[1]
    })
  );
  expect(component.borderOffset[0]).toEqual(0);
  expect(component.borderOffset[0]).not.toBeCloseTo(-startValues[1], 4);
  expect(component.borderOffset[1]).toEqual(startValues[1]);
  expect(component.borderOffset[2]).toEqual(startValues[2]);
}

function verifyStage2(startValues: Array<number>): void {
  expect(component.borderOffset[3]).toEqual(startValues[3]);
  component.focusBorder(1);
  expect(component['selectedBorderIndex']).toBe(1);
  component.onmouseMove(
    new MouseEvent('mousemove', {
      movementX: -0.5 * startValues[1],
      movementY: 10000
    })
  );
  expect(component.borderOffset[0]).toEqual(0);
  expect(component.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
  expect(component.borderOffset[2]).toEqual(startValues[2]);
  expect(component.borderOffset[3]).toEqual(startValues[3]);
  component.focusBorder(3);
  expect(component['selectedBorderIndex']).toBe(3);
  component.onmouseMove(
    new MouseEvent('mousemove', {
      movementX: -startValues[3] + (0.5 * startValues[1]) + 60,
      movementY: 10000
    })
  );
  expect(component.borderOffset[0]).toEqual(0);
  expect(component.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
  expect(component.borderOffset[2]).toEqual(startValues[2]);
  expect(component.borderOffset[3]).not.toBeCloseTo(
    (0.5 * startValues[1]) + 60,
    4
  );
  expect(component.borderOffset[3]).toEqual(startValues[3]);
}

function verifyStage3(startValues: Array<number>): void {
  component.onmouseMove(
    new MouseEvent('mousemove', {
      movementX: -startValues[3] + (0.5 * startValues[1]) + 80,
      movementY: 10000
    })
  );
  expect(component.borderOffset[0]).toEqual(0);
  expect(component.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
  expect(component.borderOffset[2]).toEqual(startValues[2]);
  expect(component.borderOffset[3]).toBeCloseTo((0.5 * startValues[1]) + 80, 4);
  component.focusBorder(0);
  expect(component['selectedBorderIndex']).toBe(0);
  component.onmouseMove(
    new MouseEvent('mousemove', { movementX: 10, movementY: startValues[0] })
  );
  expect(component.borderOffset[0]).toEqual(startValues[0]);
  expect(component.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
  expect(component.borderOffset[2]).toEqual(startValues[2]);
  expect(component.borderOffset[3]).toBeCloseTo((0.5 * startValues[1]) + 80, 4);
  component.focusBorder(2);
  expect(component['selectedBorderIndex']).toBe(2);
  component.onmouseMove(
    new MouseEvent('mousemove', {
      movementX: 200,
      movementY: (-startValues[2] + startValues[0]) - 75
    })
  );
  expect(component.borderOffset[0]).toEqual(startValues[0]);
}

function verifyStage4(startValues: Array<number>): void {
  expect(component.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
  expect(component.borderOffset[2]).not.toBeCloseTo(startValues[0] - 75, 4);
  expect(component.borderOffset[2]).toEqual(startValues[2]);
  expect(component.borderOffset[3]).toBeCloseTo((0.5 * startValues[1]) + 80, 4);
  component.onmouseMove(
    new MouseEvent('mousemove', {
      movementX: 200,
      movementY: -startValues[2] + startValues[0] + 75
    })
  );
  expect(component.borderOffset[0]).toEqual(startValues[0]);
  expect(component.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
  expect(component.borderOffset[2]).toEqual(startValues[0] + 75);
  expect(component.borderOffset[3]).toBeCloseTo((0.5 * startValues[1]) + 80, 4);
  component.focusBorder(0);
  expect(component['selectedBorderIndex']).toBe(0);
  component.onmouseMove(
    new MouseEvent('mousemove', { movementX: 10, movementY: 200 })
  );
  expect(component.borderOffset[0]).not.toBeCloseTo(startValues[0] + 200, 4);
  expect(component.borderOffset[0]).toEqual(startValues[0]);
  expect(component.borderOffset[1]).toBeCloseTo(0.5 * startValues[1], 4);
  expect(component.borderOffset[2]).toEqual(startValues[0] + 75);
  expect(component.borderOffset[3]).toBeCloseTo((0.5 * startValues[1]) + 80, 4);
  expect(logService.sendErrorLog).not.toHaveBeenCalled();
  expect(vi.spyOn(component, 'submit')).not.toHaveBeenCalled();
}

function verifyScenario5(): void {
  fixture.detectChanges();

  const startValues = [
    customFrame.top,
    customFrame.left,
    customFrame.top + customFrame.height,
    customFrame.left + customFrame.width
  ];

  verifyStage1(startValues);

  verifyStage2(startValues);

  verifyStage3(startValues);

  verifyStage4(startValues);
}


describe('CalibrationComponent', () => {
  setupTests();

  it('should update border offset correctly', verifyScenario5);
});
