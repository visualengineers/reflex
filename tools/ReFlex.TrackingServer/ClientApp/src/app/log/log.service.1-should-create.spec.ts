import { LogLevel, LogMessageDetail } from '@reflex/shared-types';
import { httpClient, httpTestingController, service, setupTests } from './log.service.test-context';

describe('LogService', () => {
  setupTests();

  it('should create', () => {
    expect(service).toBeTruthy();
    expect(httpTestingController).toBeTruthy();
    expect(httpClient).toBeTruthy();
  });

  it('should send errors to correct address', () => {
    const errorMsg = 'This is a test message for LogService.sendErrorLog.';
    service.sendErrorLog(errorMsg);

    const matchUrl = 'http://localhost/api/Log/Add/';

    const req = httpTestingController.expectOne({
      url: matchUrl,
      method: 'POST'
    });

    expect(req.request.headers.get('Content-Type')).toEqual('application/json');
    expect(req.request.body).toEqual({ name: 'message', value: errorMsg });

    req.flush('');
  });

  it('should correctly retrieve messages', () => {
    const logMessages = [
      { id: 0, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
      { id: 1, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
      { id: 2, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
      { id: 3, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' }
    ];

    let i = 0;

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
        expect(i).toBe(4);
        expect(service['index']).toBe(3);
      }
    );

    const matchUrl = 'http://localhost/api/Log/Messages/0';

    const req = httpTestingController.expectOne({
      url: matchUrl,
      method: 'GET'
    });

    req.flush(logMessages);
  });
});
