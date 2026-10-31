import { LogLevel, LogMessageDetail } from '@reflex/shared-types';
import { httpTestingController, service, setupTests } from './log.service.test-context';

describe('LogService', () => {
  setupTests();

  it('should correctly apply and reset index', () => {
    const logMessages = [
      { id: 0, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
      { id: 1, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
      { id: 2, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
      { id: 3, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
      { id: 4, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
      { id: 5, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
      { id: 6, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
      { id: 7, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
      { id: 8, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
      { id: 9, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
      { id: 10, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
      { id: 11, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
      { id: 12, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
      { id: 13, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
      { id: 14, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
      { id: 15, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
      { id: 16, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
      { id: 17, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
      { id: 18, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
      { id: 19, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' }
    ];

    let i = 10;
    service['index'] = i;

    service.getLogs().subscribe(
      (list: LogMessageDetail) => {
        expect(list).toEqual(logMessages[i]);
        i++;
      },
      (error) => {
        console.error(error);
        expect.fail();
      },
      () => {
        expect(i).toBe(20);
        expect(service['index']).toBe(19);

        service.reset();
        expect(service['index']).toBe(0);
      }
    );

    const matchUrl = 'http://localhost/api/Log/Messages/10';

    const req = httpTestingController.expectOne({
      url: matchUrl,
      method: 'GET'
    });

    req.flush(logMessages.filter((msg) => msg.id >= 10));
  });
});
