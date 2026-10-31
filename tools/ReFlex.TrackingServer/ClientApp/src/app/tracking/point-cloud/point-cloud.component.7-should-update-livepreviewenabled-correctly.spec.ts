import {
  Point3
} from '@reflex/shared-types';
import { BehaviorSubject } from 'rxjs';
import { component, fixture, setupTests } from './point-cloud.component.test-context';
import { logService, pointCloudService } from './point-cloud.component.test-data';

describe('PointCloudComponent', () => {
  setupTests();

  it('should update livePreviewEnabled correctly', () => {
    const obs = new BehaviorSubject(new Array<Point3>());

    pointCloudService.getPointCloud.mockReturnValue(obs);

    component.livePreview = true;
    component.livePreviewChanged();

    fixture.detectChanges();

    expect(pointCloudService.getPointCloud).toHaveBeenCalledTimes(1);

    obs.next([{ x: 1, y: 2, z: 3, isValid: true, isFiltered: false }]);
    obs.next([
      { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
      { x: 7, y: 8, z: 9, isValid: true, isFiltered: false }
    ]);
    obs.next([{ x: 10, y: 11, z: 12, isValid: true, isFiltered: false }]);

    expect(component.numFramesReceived).toBe(3);

    component.livePreviewEnabled = false;

    expect(component.numFramesReceived).toBe(0);

    obs.next([{ x: 1, y: 2, z: 3, isValid: true, isFiltered: false }]);
    obs.next([
      { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
      { x: 7, y: 8, z: 9, isValid: true, isFiltered: false }
    ]);

    expect(component.numFramesReceived).toBe(0);

    component.livePreviewEnabled = true;

    obs.next([
      { x: 4, y: 5, z: 6, isValid: true, isFiltered: false },
      { x: 7, y: 8, z: 9, isValid: true, isFiltered: false }
    ]);
    obs.next([{ x: 10, y: 11, z: 12, isValid: true, isFiltered: false }]);

    expect(component.numFramesReceived).toBe(0);

    component.livePreview = true;
    component.livePreviewChanged();

    obs.next([{ x: 1, y: 2, z: 3, isValid: true, isFiltered: false }]);

    // strange: does start with 2 (?)
    expect(component.numFramesReceived).toBe(2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should emit fullScreenChanged when fullscreen is toggled', () => {
    vi.spyOn(component.fullScreenChanged, 'emit');

    expect(vi.spyOn(component.fullScreenChanged, 'emit')).not.toHaveBeenCalled();

    expect(component.fullScreen).toBe(false);

    component.fullScreen = false;

    expect(vi.spyOn(component.fullScreenChanged, 'emit')).toHaveBeenCalledTimes(1);

    expect(vi.spyOn(component.fullScreenChanged, 'emit')).toHaveBeenCalledWith(false);

    component.fullScreen = true;

    expect(vi.spyOn(component.fullScreenChanged, 'emit')).toHaveBeenCalledWith(true);
    expect(vi.spyOn(component.fullScreenChanged, 'emit')).toHaveBeenCalledTimes(2);

    component.fullScreen = true;

    expect(vi.spyOn(component.fullScreenChanged, 'emit')).toHaveBeenCalledTimes(3);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});
