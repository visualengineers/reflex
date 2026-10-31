import { By } from '@angular/platform-browser';
import { component, fixture, setupTests } from './depth-image.component.test-context';
import { trackingService } from './depth-image.component.test-data';

describe('DepthImageComponent', () => {
  setupTests();

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize correctly', () => {
    expect(component).toBeTruthy();

    expect(component.livePreview).toBe(false);
    expect(component.livePreviewEnabled).toBe(false);
    expect(component.numFramesReceived).toBe(0);

    expect(trackingService.getStatus).toHaveBeenCalledTimes(1);

    // if livePreview is false, container should not be defined
    expect(component.container).toBeUndefined();
  });

  it('should emit fullscreenChanged', () => {
    expect(component.fullScreen).toBe(false);

    const fullScreenChangedSpy = vi.spyOn(component.fullScreenChanged, 'emit');

    component.fullScreen = true;

    expect(component.fullScreen).toBe(true);
    expect(fullScreenChangedSpy).toHaveBeenCalledTimes(1);
    expect(fullScreenChangedSpy).toHaveBeenCalledWith(true);
  });

  it('should update livePreview value', async () => {
    const livePreviewSpy = vi.spyOn(component, 'livePreviewChanged');

    expect(component).toBeTruthy();

    expect(component.livePreview).toBe(false);
    expect(component.numFramesReceived).toBe(0);

    fixture.componentRef.setInput('livePreviewEnabled', true);
    fixture.detectChanges();
    await fixture.whenStable();
    component.livePreview = true;

    expect(component.livePreview).toBe(true);

    fixture.componentRef.setInput('livePreviewEnabled', false);
    fixture.detectChanges();
    await await fixture.whenStable();

    expect(component.livePreview).toBe(false);

    expect(livePreviewSpy).toHaveBeenCalled();

    fixture.componentRef.setInput('livePreviewEnabled', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const cbLivePreview = fixture.debugElement.query(
      By.css('#checkbox-livePreviewDepthImage')
    ).nativeElement as HTMLInputElement;
    cbLivePreview.click();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(livePreviewSpy).toHaveBeenCalledTimes(2);

    expect(component.livePreview).toBe(true);

    expect(component.container).toBeTruthy();
  });
});
