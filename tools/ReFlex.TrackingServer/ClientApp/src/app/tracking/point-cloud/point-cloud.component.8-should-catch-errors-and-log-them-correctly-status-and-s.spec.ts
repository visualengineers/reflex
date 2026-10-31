import { throwError } from 'rxjs';
import { component, fixture, setupTests } from './point-cloud.component.test-context';
import { logService, pointCloudService, processingService, settingsService, trackingService } from './point-cloud.component.test-data';

describe('PointCloudComponent', () => {
  setupTests();

  it('should catch errors and log them correctly: status and settings', () => {
    const errorSettings = 'TestError: settingsService.getSettings';
    settingsService.getSettings.mockReturnValue(throwError(errorSettings));

    const errorStatus = 'TestError: trackingService.getStatus';
    trackingService.getStatus.mockReturnValue(throwError(errorStatus));

    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorSettings);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorStatus);
  });

  it('should catch errors and log them correctly: pointCloud and interactions', () => {
    const errorPointCloud = 'TestError: pointCloudService.getPointCloud';
    pointCloudService.getPointCloud.mockReturnValue(
      throwError(errorPointCloud)
    );

    const errorInteractions = 'TestError: processingService.getInteractions';
    processingService.getInteractions.mockReturnValue(
      throwError(errorInteractions)
    );

    component.livePreview = true;
    component.livePreviewChanged();
    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorPointCloud);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorInteractions);
  });

  it('should update grid visibility', () => {
    fixture.detectChanges();

    expect(component.showGrid).toBe(true);
    expect(component['grid'].visible).toBe(true);

    component.showGrid = false;
    component.updateGridVisibility();

    expect(component['grid'].visible).toBe(false);
  });

  it('should update planes visibility', () => {
    fixture.detectChanges();

    expect(component.showDistancePlanes).toBe(true);
    expect(component['zeroPlane'].visible).toBe(true);
    expect(component['maxPlane1'].visible).toBe(true);
    expect(component['maxPlane2'].visible).toBe(true);
    expect(component['minPlane1'].visible).toBe(true);
    expect(component['minPlane2'].visible).toBe(true);

    component.showDistancePlanes = false;
    component.updatePlanesVisibility();

    expect(component['zeroPlane'].visible).toBe(false);
    expect(component['maxPlane1'].visible).toBe(false);
    expect(component['maxPlane2'].visible).toBe(false);
    expect(component['minPlane1'].visible).toBe(false);
    expect(component['minPlane2'].visible).toBe(false);
  });
});
