import { TestBed } from '@angular/core/testing';
import { RecordingComponent } from './recording.component';
import { component, fixture, setupTests } from './recording.component.1.test-context';
import { recordingService } from './recording.component.test-data';

describe('RecordingComponent: storage format', () => {
  setupTests();

  it('should default to JPG', () => {
    expect(component.usePng).toBe(false);
    component.startRecording();
    expect(recordingService.startRecording).toHaveBeenCalledWith(component.recordingName, false);
  });

  it.each([true, false])('should preserve usePng=%s when the view is recreated', async (usePng) => {
    component.usePng = !usePng;
    component.usePng = usePng;
    fixture.destroy();

    const restoredFixture = TestBed.createComponent(RecordingComponent);
    const restored = restoredFixture.componentInstance;
    restoredFixture.detectChanges();
    await restoredFixture.whenStable();

    const element = restoredFixture.nativeElement as HTMLElement;
    const select = element.querySelector<HTMLSelectElement>('#recording-format-select');

    expect(restored.usePng).toBe(usePng);
    expect(select?.selectedIndex).toBe(usePng ? 1 : 0);
    restored.startRecording();
    expect(recordingService.startRecording).toHaveBeenCalledWith(restored.recordingName, usePng);
    restoredFixture.destroy();
  });

  it('should pass the selected PNG option and lock the selection during recording', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const select = element.querySelector<HTMLSelectElement>('#recording-format-select');

    expect(select).not.toBeNull();
    if (!select) {
      throw new Error('Missing storage format selection');
    }

    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(component.usePng).toBe(true);
    component.startRecording();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(recordingService.startRecording).toHaveBeenCalledWith(component.recordingName, true);
    expect(select.disabled).toBe(true);

    component.stopRecording();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(select.disabled).toBe(false);
  });
});
