import { Subject, throwError } from 'rxjs';
import {
  measure,
  mount,
  setupTests as setupZonelessTests,
  text
} from '../../test-utils/zoneless-change-detection.test-context';
import { MeasureControlsComponent } from './measure-controls.component';
import {
  component as testComponent,
  fixture as testFixture,
  setupTests
} from './measure-controls.component.test-context';
import { logService, measureService } from './measure-controls.component.test-data';

describe('Zoneless change detection: renders capture-state and sample-index polling independently', () => {
  setupZonelessTests();

  it('renders capture-state and sample-index polling independently', async () => {
    const capturing = new Subject<boolean>();
    const index = new Subject<number>();
    measure.isCapturing.mockReturnValue(capturing);
    measure.getCurrentSampleIdx.mockReturnValue(index);
    const fixture = await mount(MeasureControlsComponent);
    await new Promise((resolve) => setTimeout(resolve, 0));
    capturing.next(true);
    await fixture.whenStable();
    expect(text(fixture)).toContain('Captured Frame');
    index.next(7);
    await fixture.whenStable();
    expect(text(fixture)).toContain('7 / 10');
  });
});

describe('MeasureControlsComponent', () => {
  setupTests();

  it('should create', () => {
    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(testComponent.captureId).toBe(0);
    expect(testComponent.isCapturing).toBe(false);
    expect(testComponent.numFramesCaptured).toBe(0);
    expect(measureService.startCapture).toHaveBeenCalledTimes(0);
  });

  it('should correctly subscribe to sample index', async () => {
    testFixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 50));

    testComponent.ngOnDestroy();
    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(testComponent.isCapturing).toBe(true);
    expect(testComponent.numFramesCaptured).toBe(123);
  });

  it('should correctly start capture', () => {
    testFixture.detectChanges();

    expect(measureService.startCapture).toHaveBeenCalledTimes(0);

    testComponent.captureId = 12345;

    testComponent.captureFrames();
    expect(measureService.startCapture).toHaveBeenCalledTimes(1);
    expect(measureService.startCapture).toHaveBeenCalledWith(12345);
  });

  it('should handle errors correctly: IsCapturing', async () => {
    const errorCapturing = 'TestError: measureService.isCapturing';
    measureService.isCapturing.mockReturnValue(throwError(errorCapturing));

    testFixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 50));

    testComponent.ngOnDestroy();
    expect(testComponent.numFramesCaptured).toBe(0);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorCapturing);
  });

  it('should handle errors correctly: getCurrentSampleIdx', async () => {
    const errorSampleIdx = 'TestError: measureService.getCurrentSampleIdx';
    measureService.getCurrentSampleIdx.mockReturnValue(
      throwError(errorSampleIdx)
    );

    testFixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 50));

    testComponent.ngOnDestroy();
    expect(testComponent.isCapturing).toBe(true);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSampleIdx);
  });

  it('should handle errors correctly: StartCapture', () => {
    const errorStart = 'TestError: measureService.startCapture';
    measureService.startCapture.mockReturnValue(throwError(errorStart));

    testFixture.detectChanges();

    testComponent.captureId = 12345;

    testComponent.captureFrames();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStart);
  });
});
