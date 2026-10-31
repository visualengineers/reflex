import { TestBed } from '@angular/core/testing';

import { GestureReplayService } from './gesture-replay.service';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import { Gesture } from '../data/gesture';
import { GestureTrack } from '../data/gesture-track';
import { ConnectionService } from './connection.service';
import { ConfigurationService } from './configuration.service';
import { GestureTrackFrame } from '../data/gesture-track-frame';

describe('GestureReplayService', () => {
  let service: GestureReplayService;

  let httpTestingController: HttpTestingController;
  let connectionService: ConnectionService;
  let configService: ConfigurationService;

  const testTrack: GestureTrack = {
    touchId: 0,
    frames: [
      { x: 100, y: 123, z: -0.5 },
      { x: 250, y: 25, z: -0.3 },
      { x: 0, y: 200, z: -0.2 },
      { x: 568, y: 750, z: 0.5 },
    ],
    startFrame: 0,
  };

  const testData: Gesture = {
    id: 5,
    name: 'testGestureData',
    numFrames: 4,
    speed: 2,
    tracks: [testTrack],
  };

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(GestureReplayService);

    service.loopGesture = false;

    TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    connectionService = TestBed.inject(ConnectionService);
    configService = TestBed.inject(ConfigurationService);
  });

  afterEach(() => {
    // After every test, assert that there are no more pending requests.
    httpTestingController.verify();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load gesture from file and start replay', async () => {
    // just assert, that sendmessage is called at least once
    const sendSpy = vi.spyOn(connectionService, 'sendMessage').mockImplementation(() => {});

    const file = 'data/dat-file.json';

    const data = testData;

    service.init(file);

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

    service.init(file);

    const req = httpTestingController.expectOne(file);
    expect(req.request.method).toEqual('GET');
    expect(req.request.responseType).toEqual('json');

    req.flush(data);

    await vi.advanceTimersByTimeAsync(1200);
    // 2 times speed, 1000ms send interval --> called after 500 & 1000ms
    expect(sendSpy).toHaveBeenCalledTimes(2);
  });

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
            z: i[0].position.z,
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

  it('should send correct values and loop properly', async () => {
    const receivedFrames: Array<GestureTrackFrame> = [];

    service.loopGesture = true;

    // just assert, that sendmessage is called at least once
    const sendSpy = vi
      .spyOn(connectionService, 'sendMessage')
      .mockImplementation((i) => {
        if (i.length === 1) {
          receivedFrames.push({
            x: i[0].position.x,
            y: i[0].position.y,
            z: i[0].position.z,
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

    await vi.advanceTimersByTimeAsync(525);
    // 2 times speed, 100ms send interval --> finished after 200ms
    expect(sendSpy).toHaveBeenCalledTimes(10);
    expect(sendSpy).not.toHaveBeenCalledWith([]);
    expect(receivedFrames).toHaveLength(10);
    expect(receivedFrames[0]).toEqual(testData.tracks[0].frames[0]);
    expect(receivedFrames[1]).toEqual(testData.tracks[0].frames[1]);
    expect(receivedFrames[2]).toEqual(testData.tracks[0].frames[2]);
    expect(receivedFrames[3]).toEqual(testData.tracks[0].frames[3]);
    expect(receivedFrames[4]).toEqual(testData.tracks[0].frames[0]);
    expect(receivedFrames[5]).toEqual(testData.tracks[0].frames[1]);
    expect(receivedFrames[6]).toEqual(testData.tracks[0].frames[2]);
    expect(receivedFrames[7]).toEqual(testData.tracks[0].frames[3]);
    expect(receivedFrames[8]).toEqual(testData.tracks[0].frames[0]);
    expect(receivedFrames[9]).toEqual(testData.tracks[0].frames[1]);
  });
});
