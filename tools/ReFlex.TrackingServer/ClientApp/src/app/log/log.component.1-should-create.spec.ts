import { of } from 'rxjs';
import { component, fixture, setupTests } from './log.component.test-context';
import { logService, messages } from './log.component.test-data';

describe('LogComponent', () => {
  setupTests();

  it('should create', () => {
    logService.getLogs.mockReturnValue(of(messages[0]));

    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.reset).toHaveBeenCalledTimes(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should receive messages', () => {
    logService.getLogs.mockReturnValue(of(messages[0]));

    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.getLogs).toHaveBeenCalledTimes(1);
    expect(component.messages).toHaveLength(1);
    expect(component.filteredMessages).toHaveLength(1);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });

  it('should automatically filter incoming messages', () => {
    logService.getLogs.mockReturnValue(of(messages[5]));
    component.filterLevel = 2;

    fixture.detectChanges();

    expect(component).toBeTruthy();

    expect(logService.getLogs).toHaveBeenCalledTimes(1);
    expect(component.messages).toHaveLength(1);
    expect(component.filteredMessages).toHaveLength(0);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});
