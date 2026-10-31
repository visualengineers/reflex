import { throwError } from 'rxjs';
import { component, fixture, setupTests } from './measure-surface.component.test-context';
import { calibrationService, customFrame, logService } from './measure-surface.component.test-data';

describe('MeasureSurfaceComponent', () => {
  setupTests();

  it('should create and initialize values correctly', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(component['frameSize']).toEqual(customFrame);
    expect(component.fullScreen).toBe(false);
  });

  it('should handle errors correctly', () => {
    const errorFrameSize = 'Test Error: calibrationService.getFrameSize';
    calibrationService.getFrameSize.mockReturnValue(throwError(errorFrameSize));

    fixture.detectChanges();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorFrameSize);
  });

  it('should correctly apply style', () => {
    fixture.detectChanges();

    expect(component.fullScreen).toBe(false);

    const expected1 = {
      position: 'relative',
      top: '0',
      left: '0',
      width: '100%',
      height: '40vh'
    };
    const expected2 = {
      position: 'absolute',
      top: `${customFrame.top}px`,
      left: `${customFrame.left}px`,
      width: `${customFrame.width}px`,
      height: `${customFrame.height}px`
    };

    const style1 = component.getViewStyle();

    expect(style1).toEqual(expected1);

    component.fullScreen = true;

    const style2 = component.getViewStyle();

    expect(style2).toEqual(expected2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});
