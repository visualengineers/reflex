import { component, fixture, setupTests } from './calibration.component.test-context';
import { customFrame, defaultFrame, logService } from './calibration.component.test-data';

describe('CalibrationComponent', () => {
  setupTests();

  it('should reset borders correctly', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(component.borderOffset).toEqual([
      customFrame.top,
      customFrame.left,
      customFrame.top + customFrame.height,
      customFrame.left + customFrame.width
    ]);

    component.resetBorders();

    expect(component.borderOffset).toEqual(defaultFrame);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(vi.spyOn(component, 'submit')).not.toHaveBeenCalled();
  });
});
