import { of } from 'rxjs';
import { component, fixture, setupTests } from './point-cloud.component.test-context';
import { pointCloudService } from './point-cloud.component.test-data';

describe('PointCloudComponent', () => {
  setupTests();

  it('should update point cloud service emits new values', () => {
    pointCloudService.getPointCloud.mockReturnValue(
      of(
        [{ x: 1, y: 2, z: 3, isValid: true, isFiltered: false }],
        [
          { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
          { x: 7, y: 8, z: 9, isValid: true, isFiltered: false }
        ],
        [{ x: 10, y: 11, z: 12, isValid: true, isFiltered: false }]
      )
    );

    component.livePreview = true;
    component.livePreviewChanged();

    fixture.detectChanges();

    expect(pointCloudService.getPointCloud).toHaveBeenCalledTimes(1);

    expect(component.numFramesReceived).toBe(3);

    expect(
      component['points'].geometry?.attributes?.position?.array[0]
    ).toBeCloseTo(100, 4);
    expect(
      component['points'].geometry?.attributes?.position?.array[1]
    ).toBeCloseTo(-110, 4);
    expect(
      component['points'].geometry?.attributes?.position?.array[2]
    ).toBeCloseTo(120, 4);
  });
});
