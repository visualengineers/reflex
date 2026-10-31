import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TouchPointService } from 'src/services/touch-point.service';
import type { MockedObject } from 'vitest';
import { queryElement } from '../../../../../test/helpers/dom';
import {
  frames,
  interaction,
  points,
  setupTests as setupZonelessTests,
  service
} from '../test-utils/zoneless-change-detection.test-context';
import { StatusComponent } from './status.component';

const dummyTouchPointService: MockedObject<Pick<TouchPointService, 'getTouchPoints' | 'getFrameNumber' | 'getHistory' | 'getAddress' | 'isConnected'>> = {
  getTouchPoints: vi.fn().mockName('TouchPointService.getTouchPoints'),
  getHistory: vi.fn().mockName('TouchPointService.getHistory'),
  getAddress: vi.fn().mockName('TouchPointService.getAddress'),
  getFrameNumber: vi.fn().mockName('TouchPointService.getFrameNumber'),
  isConnected: vi.fn().mockName('TouchPointService.isConnected')
};

describe('StatusComponent', () => {
  let component: StatusComponent;
  let fixture: ComponentFixture<StatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusComponent],
      providers: [{ provide: TouchPointService, useValue: dummyTouchPointService }]
    }).compileComponents();

    dummyTouchPointService.getTouchPoints.mockReturnValue(of([]));
    dummyTouchPointService.isConnected.mockReturnValue(true);
    dummyTouchPointService.getFrameNumber.mockReturnValue(of(1));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('Zoneless change detection: renders WebSocket touch counts and frame numbers', () => {
  setupZonelessTests();

  it('renders WebSocket touch counts and frame numbers', async () => {
    const fixture = TestBed.createComponent(StatusComponent);
    await fixture.whenStable();
    points.next([interaction(1), interaction(2)]);
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLInputElement)
        .querySelectorAll('.status__stats--item')[2]
        .textContent?.trim()
    ).toBe('2');
    frames.next(8123);
    await fixture.whenStable();
    const values = [...(fixture.nativeElement as HTMLInputElement).querySelectorAll('.status__stats--item')].map((e) => e.textContent?.trim());
    expect(values).toEqual(['ws://test', '8123', '2']);
    fixture.destroy();
    expect(points.observed).toBe(false);
    expect(frames.observed).toBe(false);
  });
});

describe('Zoneless change detection: renders connection polling and stops the timer when destroyed', () => {
  setupZonelessTests();

  it('renders connection polling and stops the timer when destroyed', async () => {
    const fixture = TestBed.createComponent(StatusComponent);
    await fixture.whenStable();
    const polled = new Promise<void>((resolve) =>
      service.isConnected.mockImplementation(() => {
        resolve();

        return true;
      }));
    await polled;
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '.status__indicator').style
        .backgroundColor
    ).toBe('green');
    fixture.destroy();
    service.isConnected.mockClear();
    await new Promise((resolve) => setTimeout(resolve, 550));
    expect(service.isConnected).not.toHaveBeenCalled();
  });
});
