import { LogLevel, LogMessageDetail } from '@reflex/shared-types';
import { Subject, of, throwError } from 'rxjs';
import {
  log,
  mount,
  setupTests as setupZonelessTests,
  text
} from '../test-utils/zoneless-change-detection.test-context';
import { LogComponent } from './log.component';
import { component as testComponent, fixture as testFixture, setupTests } from './log.component.test-context';
import { logService, messages } from './log.component.test-data';

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

describe('LogComponent', () => {
  setupTests();

  it('should create', () => {
    logService.getLogs.mockReturnValue(of(messages[0]));

    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();

    expect(logService.reset).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should receive messages', () => {
    logService.getLogs.mockReturnValue(of(messages[0]));

    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();

    expect(logService.getLogs).toHaveBeenCalledTimes(1);
    expect(testComponent.messages).toHaveLength(1);
    expect(testComponent.filteredMessages).toHaveLength(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should automatically filter incoming messages', () => {
    logService.getLogs.mockReturnValue(of(messages[5]));
    testComponent.filterLevel = 2;

    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();

    expect(logService.getLogs).toHaveBeenCalledTimes(1);
    expect(testComponent.messages).toHaveLength(1);
    expect(testComponent.filteredMessages).toHaveLength(0);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});

describe('LogComponent', () => {
  setupTests();

  it('should filter correctly', () => {
    testComponent.messages = messages;

    testFixture.detectChanges();

    testComponent.filter();

    expect(testComponent.filteredMessages).toHaveLength(messages.length);
    expect(testComponent.filteredMessages).toEqual(messages);

    // only TRACE messages
    testComponent.filterLevel = 0;

    testComponent.filter();

    expect(testComponent.filteredMessages).toHaveLength(5);
    expect(testComponent.filteredMessages).toEqual([
      messages[5],
      messages[8],
      messages[10],
      messages[12],
      messages[14]
    ]);

    // only DEBUG messages
    testComponent.filterLevel = 1;
    testComponent.filter();

    expect(testComponent.filteredMessages).toHaveLength(2);
    expect(testComponent.filteredMessages).toEqual([messages[0], messages[1]]);

    // only INFO messages
    testComponent.filterLevel = 2;
    testComponent.filter();

    expect(testComponent.filteredMessages).toHaveLength(0);
    expect(testComponent.filteredMessages).toEqual([]);

    // only WARN messages
    testComponent.filterLevel = 3;
    testComponent.filter();

    expect(testComponent.filteredMessages).toHaveLength(3);
    expect(testComponent.filteredMessages).toEqual([
      messages[2],
      messages[3],
      messages[4]
    ]);

    // only ERROR messages
    testComponent.filterLevel = 4;
    testComponent.filter();

    expect(testComponent.filteredMessages).toHaveLength(4);
    expect(testComponent.filteredMessages).toEqual([
      messages[6],
      messages[7],
      messages[9],
      messages[13]
    ]);

    // only FATAL messages
    testComponent.filterLevel = 5;
    testComponent.filter();

    expect(testComponent.filteredMessages).toHaveLength(1);
    expect(testComponent.filteredMessages).toEqual([messages[11]]);

    // OFF
    testComponent.filterLevel = 6;
    testComponent.filter();

    expect(testComponent.filteredMessages).toHaveLength(0);
    expect(testComponent.filteredMessages).toEqual([]);

    // reset filter
    testComponent.filterLevel = -1;
    testComponent.filter();

    expect(testComponent.filteredMessages).toHaveLength(15);
    expect(testComponent.filteredMessages).toEqual(messages);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});

describe('LogComponent', () => {
  setupTests();

  it('reset messages correctly', () => {
    testComponent.messages = messages;

    testFixture.detectChanges();
    testComponent.filter();

    expect(testComponent.messages).toHaveLength(15);
    expect(testComponent.filteredMessages).toHaveLength(15);

    testComponent.refresh();

    expect(testComponent.messages).toHaveLength(0);
    expect(testComponent.filteredMessages).toHaveLength(0);

    expect(logService.reset).toHaveBeenCalledTimes(2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should correctly return class for log level', () => {
    testFixture.detectChanges();

    expect(testComponent.getClass(LogLevel.Trace)).toEqual('table-dark');
    expect(testComponent.getClass(LogLevel.Info)).toEqual('table-dark');
    expect(testComponent.getClass(LogLevel.Debug)).toEqual('table-info');
    expect(testComponent.getClass(LogLevel.Warn)).toEqual('table-warning');
    expect(testComponent.getClass(LogLevel.Error)).toEqual('table-danger');
    expect(testComponent.getClass(LogLevel.Fatal)).toEqual('table-danger');
    expect(testComponent.getClass(LogLevel.Off)).toEqual('table-light');
  });

  it('should handle errors correctly', () => {
    const errorLogs = 'TestError: logService.getLogs';
    logService.getLogs.mockReturnValue(throwError(errorLogs));

    testFixture.detectChanges();

    expect(testComponent).toBeTruthy();

    expect(logService.getLogs).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorLogs);

    expect(testComponent.messages).toBeDefined();
    expect(testComponent.filteredMessages).toBeDefined();
  });
});
