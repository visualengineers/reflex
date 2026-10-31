import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Gesture } from '../data/gesture';
import { GestureTrack } from '../data/gesture-track';
import { ConfigurationService } from './configuration.service';
import { ConnectionService } from './connection.service';
import { GestureReplayService } from './gesture-replay.service';

export let service: GestureReplayService;

export let httpTestingController: HttpTestingController;

export let connectionService: ConnectionService;

export let configService: ConfigurationService;

export const testTrack: GestureTrack = {
  touchId: 0,
  frames: [
    { x: 100, y: 123, z: -0.5 },
    { x: 250, y: 25, z: -0.3 },
    { x: 0, y: 200, z: -0.2 },
    { x: 568, y: 750, z: 0.5 }
  ],
  startFrame: 0
};

export const testData: Gesture = {
  id: 5,
  name: 'testGestureData',
  numFrames: 4,
  speed: 2,
  tracks: [testTrack]
};

export function setupTests(): void {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
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
}
