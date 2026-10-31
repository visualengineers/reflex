import { LogLevel, LogMessageDetail } from '@reflex/shared-types';
import { Subject } from 'rxjs';
import {
  log,
  mount,
  setupTests as setupZonelessTests,
  text
} from '../test-utils/zoneless-change-detection.test-context';
import { LogComponent } from './log.component';

describe('Zoneless change detection: renders log polling emissions and detaches on destruction', () => {
  setupZonelessTests();

  it('renders log polling emissions and detaches on destruction', async () => {
    const response = new Subject<LogMessageDetail>();
    log.getLogs.mockReturnValue(response);
    const fixture = await mount(LogComponent);
    response.next({
      id: 42,
      formattedMessage: 'Async log message',
      level: LogLevel.Info
    });
    await fixture.whenStable();
    expect(text(fixture)).toContain('Async log message');
    fixture.destroy();
    expect(response.observed).toBe(false);
  });
});
