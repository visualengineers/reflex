import { configService, connectionService, httpTestingController, service, setupTests, testData } from './gesture-replay.service.test-context';

describe('GestureReplayService', () => {
  setupTests();

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load gesture from file and start replay', async () => {
    const sendSpy = vi.spyOn(connectionService, 'sendMessage').mockImplementation(() => {});

    const file = 'data/dat-file.json';

    const data = testData;

    service.initFile(file);

    const req = httpTestingController.expectOne(file);
    expect(req.request.method).toEqual('GET');
    expect(req.request.responseType).toEqual('json');

    req.flush(data);
    await vi.advanceTimersByTimeAsync(100);
    expect(sendSpy).toHaveBeenCalled();
  });

  it('should correctly set interval', async () => {
    // just assert, that sendmessage is called at least once
    const sendSpy = vi
      .spyOn(connectionService, 'sendMessage')
      .mockImplementation(() => {});

    configService.setSendInterval(1000);

    const file = 'data/dat-file.json';

    const data = testData;

    service.initFile(file);

    const req = httpTestingController.expectOne(file);
    expect(req.request.method).toEqual('GET');
    expect(req.request.responseType).toEqual('json');

    req.flush(data);

    await vi.advanceTimersByTimeAsync(1200);
    // 2 times speed, 1000ms send interval --> called after 500 & 1000ms
    expect(sendSpy).toHaveBeenCalledTimes(2);
  });
});
