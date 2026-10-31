import { component, fixture, setupTests } from './log.component.test-context';
import { logService, messages } from './log.component.test-data';

describe('LogComponent', () => {
  setupTests();

  it('should filter correctly', () => {
    component.messages = messages;

    fixture.detectChanges();

    component.filter();

    expect(component.filteredMessages).toHaveLength(messages.length);
    expect(component.filteredMessages).toEqual(messages);

    // only TRACE messages
    component.filterLevel = 0;

    component.filter();

    expect(component.filteredMessages).toHaveLength(5);
    expect(component.filteredMessages).toEqual([
      messages[5],
      messages[8],
      messages[10],
      messages[12],
      messages[14]
    ]);

    // only DEBUG messages
    component.filterLevel = 1;
    component.filter();

    expect(component.filteredMessages).toHaveLength(2);
    expect(component.filteredMessages).toEqual([messages[0], messages[1]]);

    // only INFO messages
    component.filterLevel = 2;
    component.filter();

    expect(component.filteredMessages).toHaveLength(0);
    expect(component.filteredMessages).toEqual([]);

    // only WARN messages
    component.filterLevel = 3;
    component.filter();

    expect(component.filteredMessages).toHaveLength(3);
    expect(component.filteredMessages).toEqual([
      messages[2],
      messages[3],
      messages[4]
    ]);

    // only ERROR messages
    component.filterLevel = 4;
    component.filter();

    expect(component.filteredMessages).toHaveLength(4);
    expect(component.filteredMessages).toEqual([
      messages[6],
      messages[7],
      messages[9],
      messages[13]
    ]);

    // only FATAL messages
    component.filterLevel = 5;
    component.filter();

    expect(component.filteredMessages).toHaveLength(1);
    expect(component.filteredMessages).toEqual([messages[11]]);

    // OFF
    component.filterLevel = 6;
    component.filter();

    expect(component.filteredMessages).toHaveLength(0);
    expect(component.filteredMessages).toEqual([]);

    // reset filter
    component.filterLevel = -1;
    component.filter();

    expect(component.filteredMessages).toHaveLength(15);
    expect(component.filteredMessages).toEqual(messages);

    expect(logService.sendErrorLog).not.toHaveBeenCalled();
  });
});
