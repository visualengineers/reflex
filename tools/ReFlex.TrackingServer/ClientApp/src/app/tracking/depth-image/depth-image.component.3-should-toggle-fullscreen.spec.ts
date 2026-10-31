import { component, fixture, setupTests } from './depth-image.component.test-context';

describe('DepthImageComponent', () => {
  setupTests();

  it('should toggle fullscreen', async () => {
    expect(component.fullScreen).toBe(false);

    expect(component.livePreview).toBe(false);
    expect(component.livePreviewEnabled).toBe(false);
    expect(component.numFramesReceived).toBe(0);

    // if livePreview is false, container should not be defined
    expect(component.container).toBeUndefined();

    component.updateSize();
    fixture.changeDetectorRef.markForCheck();

    fixture.detectChanges();
    await await fixture.whenStable();

    expect(component.fullScreen).toBe(false);

    fixture.componentRef.setInput('livePreviewEnabled', true);
    fixture.detectChanges();
    await fixture.whenStable();
    component.livePreview = true;

    component.livePreviewChanged();
    fixture.changeDetectorRef.markForCheck();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.container).toBeDefined();

    expect((component.container?.nativeElement as HTMLInputElement).classList).not.toContain(
      'fullScreen'
    );

    component.fullScreen = true;

    component.updateSize();
    fixture.changeDetectorRef.markForCheck();

    fixture.detectChanges();
    await fixture.whenStable();

    expect((component.container?.nativeElement as HTMLInputElement).classList).toContain(
      'fullScreen'
    );

    component.fullScreen = false;

    component.updateSize();
    fixture.changeDetectorRef.markForCheck();

    fixture.detectChanges();
    await fixture.whenStable();

    expect((component.container?.nativeElement as HTMLInputElement).classList).not.toContain(
      'fullScreen'
    );
  });
});
