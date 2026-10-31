import { throwError } from 'rxjs';
import { component, fixture, setupTests } from './measure-controls.component.test-context';
import { logService, measureService } from './measure-controls.component.test-data';

describe('MeasureControlsComponent', () => {
  setupTests();

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(component.captureId).toBe(0);
    expect(component.isCapturing).toBe(false);
    expect(component.numFramesCaptured).toBe(0);
    expect(measureService.startCapture).toHaveBeenCalledTimes(0);
  });

  it('should correctly subscribe to sample index', async () => {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 50));

    component.ngOnDestroy();
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(component.isCapturing).toBe(true);
    expect(component.numFramesCaptured).toBe(123);
  });

  it('should correctly start capture', () => {
    fixture.detectChanges();

    expect(measureService.startCapture).toHaveBeenCalledTimes(0);

    component.captureId = 12345;

    component.captureFrames();
    expect(measureService.startCapture).toHaveBeenCalledTimes(1);
    expect(measureService.startCapture).toHaveBeenCalledWith(12345);
  });

  it('should handle errors correctly: IsCapturing', async () => {
    const errorCapturing = 'TestError: measureService.isCapturing';
    measureService.isCapturing.mockReturnValue(throwError(errorCapturing));

    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 50));

    component.ngOnDestroy();
    expect(component.numFramesCaptured).toBe(0);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorCapturing);
  });

  it('should handle errors correctly: getCurrentSampleIdx', async () => {
    const errorSampleIdx = 'TestError: measureService.getCurrentSampleIdx';
    measureService.getCurrentSampleIdx.mockReturnValue(
      throwError(errorSampleIdx)
    );

    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 50));

    component.ngOnDestroy();
    expect(component.isCapturing).toBe(true);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSampleIdx);
  });

  it('should handle errors correctly: StartCapture', () => {
    const errorStart = 'TestError: measureService.startCapture';
    measureService.startCapture.mockReturnValue(throwError(errorStart));

    fixture.detectChanges();

    component.captureId = 12345;

    component.captureFrames();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStart);
  });
});
