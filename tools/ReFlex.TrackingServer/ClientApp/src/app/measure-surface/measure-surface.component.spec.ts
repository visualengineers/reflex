import { FrameSizeDefinition } from '@reflex/shared-types';
import { Subject, throwError } from 'rxjs';
import { queryElement } from '../../../../../../test/helpers/dom';
import {
  calibration,
  mount,
  setupTests as setupZonelessTests
} from '../test-utils/zoneless-change-detection.test-context';
import { frame } from '../test-utils/zoneless-change-detection.test-data';
import { MeasureSurfaceComponent } from './measure-surface.component';
import {
  component as testComponent,
  fixture as testFixture,
  setupTests
} from './measure-surface.component.test-context';
import { calibrationService, customFrame, logService } from './measure-surface.component.test-data';

describe('Zoneless change detection: updates the measurement viewport after frame-size responses', () => {
  setupZonelessTests();

  it('updates the measurement viewport after frame-size responses', async () => {
    const response = new Subject<FrameSizeDefinition>();
    calibration.getFrameSize.mockReturnValue(response);
    const fixture = await mount(MeasureSurfaceComponent);

    queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), '#visualization-toggle')
      .click();
    await fixture.whenStable();
    response.next(frame);
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '.measure__visualization').style.width
    ).toBe('640px');
  });
});

describe('MeasureSurfaceComponent', () => {
  setupTests();

  it('should create and initialize values correctly', () => {
    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
    expect(testComponent['frameSize']).toEqual(customFrame);
    expect(testComponent.fullScreen).toBe(false);
  });

  it('should handle errors correctly', () => {
    const errorFrameSize = 'Test Error: calibrationService.getFrameSize';
    calibrationService.getFrameSize.mockReturnValue(throwError(errorFrameSize));

    testFixture.detectChanges();

    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorFrameSize);
  });

  it('should correctly apply style', () => {
    testFixture.detectChanges();

    expect(testComponent.fullScreen).toBe(false);

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

    const style1 = testComponent.getViewStyle();

    expect(style1).toEqual(expected1);

    testComponent.fullScreen = true;

    const style2 = testComponent.getViewStyle();

    expect(style2).toEqual(expected2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});
