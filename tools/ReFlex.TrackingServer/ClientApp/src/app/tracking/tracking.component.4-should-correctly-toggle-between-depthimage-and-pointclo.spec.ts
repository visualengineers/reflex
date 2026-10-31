import { component, fixture, setupTests } from './tracking.component.1.test-context';

describe('TrackingComponent', () => {
  setupTests();

  it('should correctly toggle between DepthImage and PointCloud when setting them to fullscreen ', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.onDepthImageFullScreenChanged(true);
    expect(component.displayPointCloud).toBe(false);

    component.onDepthImageFullScreenChanged(true);
    expect(component.displayPointCloud).toBe(false);

    component.onPointCloudFullScreenChanged(true);
    expect(component.displayDepthImage).toBe(false);

    component.onDepthImageFullScreenChanged(false);
    expect(component.displayPointCloud).toBe(true);

    component.onPointCloudFullScreenChanged(false);
    expect(component.displayDepthImage).toBe(true);
  });

  it('should unsubscribe completely onDestroy', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.ngOnDestroy();

    expect(component['statusSubscription']?.closed).toBeTruthy();
    expect(component['autostartSubscription']?.closed).toBeTruthy();
    expect(component['selectedCamSubscription']?.closed).toBeTruthy();
    expect(
      component['configSubscription'] === undefined
        || component['configSubscription'].closed
    ).toBe(true);
    expect(
      component['selectedCamConfigSubscription'] === undefined
        || component['selectedCamConfigSubscription'].closed
    ).toBe(true);
    expect(
      component['cameraSubscription'] === undefined
        || component['cameraSubscription'].closed
    ).toBe(true);
  });
});
