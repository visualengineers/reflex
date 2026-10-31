import { of } from 'rxjs';
import { component, fixture, setupTests } from './point-cloud.component.test-context';
import { logService, processingService } from './point-cloud.component.test-data';

describe('PointCloudComponent', () => {
  setupTests();

  it('should create interactions when service emits new values', () => {
    processingService.getInteractions.mockReturnValue(
      of([
        {
          touchId: 0,
          position: { x: 1, y: 2, z: 3, isValid: true, isFiltered: false },
          type: 0,
          extremumDescription: {
            type: 0,
            numFittingPoints: 10,
            percentageFittingPoints: 1
          },
          confidence: 10,
          time: 123456
        },
        {
          touchId: 1,
          position: { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
          type: 0,
          extremumDescription: {
            type: 0,
            numFittingPoints: 10,
            percentageFittingPoints: 1
          },
          confidence: 0,
          time: 656565989
        }
      ])
    );

    component.livePreview = true;
    component.livePreviewChanged();

    fixture.detectChanges();

    expect(processingService.getInteractions).toHaveBeenCalledTimes(1);

    expect(component.numFramesReceived).toBe(0);

    expect(component['interactions']).toBeDefined();
    expect(component['interactions']).toHaveLength(2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});
