import { LogLevel } from '@reflex/shared-types';
import { throwError } from 'rxjs';
import { component, fixture, setupTests } from './log.component.test-context';
import { logService, messages } from './log.component.test-data';

describe('LogComponent', () => {
  setupTests();

  it('reset messages correctly', () => {
    component.messages = messages;

    fixture.detectChanges();
    component.filter();

    expect(component.messages).toHaveLength(15);
    expect(component.filteredMessages).toHaveLength(15);

    component.refresh();

    expect(component.messages).toHaveLength(0);
    expect(component.filteredMessages).toHaveLength(0);

    expect(logService.reset).toHaveBeenCalledTimes(2);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should correctly return class for log level', () => {
    fixture.detectChanges();

    expect(component.getClass(LogLevel.Trace)).toEqual('table-dark');
    expect(component.getClass(LogLevel.Info)).toEqual('table-dark');
    expect(component.getClass(LogLevel.Debug)).toEqual('table-info');
    expect(component.getClass(LogLevel.Warn)).toEqual('table-warning');
    expect(component.getClass(LogLevel.Error)).toEqual('table-danger');
    expect(component.getClass(LogLevel.Fatal)).toEqual('table-danger');
    expect(component.getClass(LogLevel.Off)).toEqual('table-light');
  });

  it('should handle errors correctly', () => {
    const errorLogs = 'TestError: logService.getLogs';
    logService.getLogs.mockReturnValue(throwError(errorLogs));

    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.getLogs).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledTimes(1);
    expect(logService.sendErrorLog).toHaveBeenCalledWith(errorLogs);

    expect(component.messages).toBeDefined();
    expect(component.filteredMessages).toBeDefined();
  });
});
