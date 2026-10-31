import { GestureTrackFrame } from '../data/gesture-track-frame';
import { configService, connectionService, httpTestingController, service, setupTests, testData } from './gesture-replay.service.test-context';

describe('GestureReplayService', () => {
  setupTests();

  it('should send correct values and stop when not looping', async () => {
    const receivedFrames: Array<GestureTrackFrame> = [];

    // just assert, that sendmessage is called at least once
    const sendSpy = vi
      .spyOn(connectionService, 'sendMessage')
      .mockImplementation((i) => {
        if (i.length === 1) {
          receivedFrames.push({
            x: i[0].position.x,
            y: i[0].position.y,
            z: i[0].position.z
          });
        }
      });

    configService.setSendInterval(100);

    const file = 'data/dat-file.json';

    const data = testData;

    service.init(file);

    const req = httpTestingController.expectOne(file);
    expect(req.request.method).toEqual('GET');
    expect(req.request.responseType).toEqual('json');

    req.flush(data);

    await vi.advanceTimersByTimeAsync(325);
    // 2 times speed, 100ms send interval --> finished after 200ms
    expect(sendSpy).toHaveBeenCalledTimes(6);
    expect(sendSpy).toHaveBeenCalledWith([]);
    expect(receivedFrames).toHaveLength(4);
    expect(receivedFrames[0]).toEqual(testData.tracks[0].frames[0]);
    expect(receivedFrames[1]).toEqual(testData.tracks[0].frames[1]);
    expect(receivedFrames[2]).toEqual(testData.tracks[0].frames[2]);
    expect(receivedFrames[3]).toEqual(testData.tracks[0].frames[3]);
  });
});
