import { component, fixture, setupTests } from './recording.component.1.test-context';
import { recordingService } from './recording.component.test-data';

describe('RecordingComponent: storage format', () => {
  setupTests();

  it('should default to JPG', () => {
    expect(component.usePng).toBe(false);
    component.startRecording();
    expect(recordingService.startRecording).toHaveBeenCalledWith(component.recordingName, false);
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
