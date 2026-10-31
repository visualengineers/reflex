import { of } from 'rxjs';
import { component, fixture, httpTestingController, setupTests } from './point-cloud.component.test-context';
import { dummyPoints, logService, pointCloudService } from './point-cloud.component.test-data';

describe('PointCloudComponent', () => {
  setupTests();

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should correctly initialize settings', () => {
    fixture.detectChanges();

    if (window !== undefined) {
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);

      httpTestingController
        .expectOne('assets/shader/pointcloud_vertex.txt')
        .flush('');
      httpTestingController
        .expectOne('assets/shader/pointcloud_fragment.txt')
        .flush('');
    }
    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should create a point cloud with the given points', () => {
    pointCloudService.getPointCloud.mockReturnValue(of(dummyPoints));

    component.livePreview = true;
    component.livePreviewChanged();

    fixture.detectChanges();

    expect(component.numFramesReceived).toBe(1);

    expect(component['isPointCloudInitialized']).toBe(true);

    expect(component['points'].geometry?.attributes?.position).toBeDefined();
    expect(
      component['points'].geometry?.attributes?.position?.array
    ).toHaveLength(dummyPoints.length * 3);

    for (let i = 0; i < dummyPoints.length; i++) {
      const n = i * 3;

      const pt = dummyPoints[i];

      expect(
        component['points'].geometry?.attributes?.position?.array[n]
      ).toBeCloseTo(pt.x * 10, 4);
      expect(
        component['points'].geometry?.attributes?.position?.array[n + 1]
      ).toBeCloseTo(pt.y * -10, 4);
      expect(
        component['points'].geometry?.attributes?.position?.array[n + 2]
      ).toBeCloseTo(pt.z * 10, 4);

      if (pt.isFiltered) {
        expect(component['points'].geometry?.attributes?.color?.array[n]).toBe(
          1
        );
        expect(
          component['points'].geometry?.attributes?.color?.array[n + 1]
        ).toBe(0);
        expect(
          component['points'].geometry?.attributes?.color?.array[n + 2]
        ).toBe(0);
      }

      // TODO: test if color are set appropriately (need to specify distances accordingly...)

      expect(logService.sendErrorLog).not.toHaveBeenCalled();
    }
  });
});
