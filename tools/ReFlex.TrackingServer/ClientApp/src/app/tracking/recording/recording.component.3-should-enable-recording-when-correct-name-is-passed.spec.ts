import { component, setupTests } from './recording.component.1.test-context';

describe('RecordingComponent', () => {
  setupTests();

  it('should enable recording when correct name is passed', () => {
    expect(typeof component.recordingName).toBe('string');

    expect(component.recordingEnabled).toBe(true);

    component.recordingName = '';

    component.recordingNameChanged();

    expect(component.recordingEnabled).toBe(false);

    component.recordingName = 'TEST2';

    component.recordingNameChanged();

    expect(component.recordingEnabled).toBe(true);

    component.recordingName = '   ';

    component.recordingNameChanged();

    expect(component.recordingEnabled).toBe(false);
  });
});
