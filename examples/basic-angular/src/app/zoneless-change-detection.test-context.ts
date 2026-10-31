import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Interaction, InteractionFrame } from '@reflex/shared-types';
import { Subject } from 'rxjs';
import { TouchPointService } from 'src/services/touch-point.service';
import type { MockedObject } from 'vitest';

export let points: Subject<Array<Interaction>>;

export let frames: Subject<number>;

export let history: Subject<Array<InteractionFrame>>;

export let service: MockedObject<Pick<TouchPointService, 'getTouchPoints' | 'getFrameNumber' | 'getHistory' | 'getAddress' | 'isConnected'>>;

export function setupTests(): void {
  beforeEach(() => {
    points = new Subject();
    frames = new Subject();
    history = new Subject();
    service = {
      getTouchPoints: vi.fn().mockName('TouchPointService.getTouchPoints'),
      getFrameNumber: vi.fn().mockName('TouchPointService.getFrameNumber'),
      getHistory: vi.fn().mockName('TouchPointService.getHistory'),
      getAddress: vi.fn().mockName('TouchPointService.getAddress'),
      isConnected: vi.fn().mockName('TouchPointService.isConnected')
    };
    service.getTouchPoints.mockReturnValue(points);
    service.getFrameNumber.mockReturnValue(frames);
    service.getHistory.mockReturnValue(history);
    service.getAddress.mockReturnValue('ws://test');
    service.isConnected.mockReturnValue(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: TouchPointService, useValue: service }
      ]
    });
  });
}

export function interaction(touchId: number, x = 0, y = 0, z = 0): Interaction {
  return { touchId,
    confidence: 1,
    time: 0,
    type: 0,
    extremumDescription: { type: 0, numFittingPoints: 0, percentageFittingPoints: 0 },
    position: { x, y, z, isFiltered: false, isValid: true } };
}
