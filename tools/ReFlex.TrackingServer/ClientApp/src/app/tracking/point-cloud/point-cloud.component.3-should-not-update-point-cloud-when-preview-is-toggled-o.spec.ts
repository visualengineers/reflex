import {
  Point3
} from '@reflex/shared-types';
import { BehaviorSubject } from 'rxjs';
import { component, fixture, setupTests } from './point-cloud.component.test-context';
import { dummyPoints, logService, pointCloudService } from './point-cloud.component.test-data';

describe('PointCloudComponent', () => {
  setupTests();

  it('should not update point cloud when preview is toggled off', () => {
    const obs = new BehaviorSubject(new Array<Point3>());

    pointCloudService.getPointCloud.mockReturnValue(obs);

    fixture.detectChanges();

    expect(pointCloudService.getPointCloud).toHaveBeenCalledTimes(1);

    obs.next([{ x: 1, y: 2, z: 3, isValid: true, isFiltered: false }]);

    expect(component.numFramesReceived).toBe(0);

    expect(
      component['points'].geometry?.attributes?.position?.array
    ).not.toBeDefined();

    component.livePreview = true;
    component.livePreviewChanged();

    obs.next([
      { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
      { x: 7, y: 8, z: 9, isValid: true, isFiltered: false }
    ]);

    obs.next([{ x: 10, y: 11, z: 12, isValid: true, isFiltered: false }]);

    // ? should this not be 2 ?
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

    component.livePreview = false;
    component.livePreviewChanged();

    obs.next(dummyPoints);

    // frames are counted, even if not subscribed !
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

    component.livePreview = true;
    component.livePreviewChanged();

    obs.next([
      { x: 14, y: 15, z: 16, isValid: true, isFiltered: false },
      { x: 17, y: 18, z: 19, isValid: true, isFiltered: false }
    ]);

    expect(component.numFramesReceived).toBe(5);

    expect(
      component['points'].geometry?.attributes?.position?.array
    ).toHaveLength(6);

    expect(
      component['points'].geometry?.attributes?.position?.array[0]
    ).toBeCloseTo(140, 4);
    expect(
      component['points'].geometry?.attributes?.position?.array[1]
    ).toBeCloseTo(-150, 4);
    expect(
      component['points'].geometry?.attributes?.position?.array[2]
    ).toBeCloseTo(160, 4);

    expect(
      component['points'].geometry?.attributes?.position?.array[3]
    ).toBeCloseTo(170, 4);
    expect(
      component['points'].geometry?.attributes?.position?.array[4]
    ).toBeCloseTo(-180, 4);
    expect(
      component['points'].geometry?.attributes?.position?.array[5]
    ).toBeCloseTo(190, 4);

    expect(pointCloudService.getPointCloud).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});
