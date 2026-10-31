import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NEVER, Subject } from 'rxjs';
import { Gesture } from '../data/gesture';
import { GestureTrackFrame } from '../data/gesture-track-frame';
import { ConnectionService } from '../service/connection.service';
import { GestureDataService } from '../service/gesture-data.service';
import { GestureReplayService } from '../service/gesture-replay.service';

export let gestures: Subject<Gesture>;

export let points: Subject<Array<GestureTrackFrame>>;

export let fileNames: Subject<Array<string>>;

export function setupTests(): void {
  beforeEach(() => {
    gestures = new Subject();
    points = new Subject();
    fileNames = new Subject();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        {
          provide: GestureDataService,
          useValue: {
            gesture$: gestures,
            gesturePoints$: points,
            getGestureFileNames: (): Subject<Array<string>> => fileNames,
            addGestureTrackFrame: vi.fn(),
            getGestureTrackFrames: (): Array<GestureTrackFrame> => [],
            getGestureNumFrames: (): number => 3
          }
        },
        { provide: GestureReplayService, useValue: { playbackFrame$: NEVER } },
        {
          provide: ConnectionService,
          useValue: {
            disconnect: vi.fn(),
            sendMessage: vi.fn()
          }
        }
      ]
    });
  });
}
