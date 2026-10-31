import {
  HttpResponse
} from '@angular/common/http';
import {
  FrameSizeDefinition
} from '@reflex/shared-types';
import { of } from 'rxjs';
import { mockReturnValueForArgs } from '../../test-utils/mock-return-value-for-args';
import { component, fixture, setupTests } from './calibration.component.test-context';
import { calibrationService, customFrame, logService } from './calibration.component.test-data';

describe('CalibrationComponent', () => {
  setupTests();

  it('should correctly submit borders to webservice', () => {
    fixture.detectChanges();

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

    expect(component.borderOffset).toEqual(startValues);

    component.borderOffset = newValues;

    mockReturnValueForArgs(calibrationService.updateFrameSize, [def], of(new HttpResponse({ body: responseDef })));

    component.updateFrameSize();

    expect(calibrationService.updateFrameSize).toHaveBeenCalledTimes(1);

    expect(calibrationService.updateFrameSize).toHaveBeenCalledWith(def);

    expect(component.borderOffset[0]).toBeCloseTo(newTop * 0.8, 4);
    expect(component.borderOffset[1]).toBeCloseTo(newLeft * 0.9, 4);

    expect(component.borderOffset[2]).toBeCloseTo(
      (newTop * 0.8) + (newHeight * 1.2),
      4
    );
    expect(component.borderOffset[3]).toBeCloseTo(
      (newLeft * 0.9) + (newWidth * 1.1),
      4
    );

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});
