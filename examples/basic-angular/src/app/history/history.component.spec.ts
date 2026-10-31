import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InteractionFrame } from '@reflex/shared-types';
import { of } from 'rxjs';
import { TouchPointService } from 'src/services/touch-point.service';
import type { MockedObject } from 'vitest';
import { queryElement } from '../../../../../test/helpers/dom';
import { history, setupTests as setupZonelessTests } from '../test-utils/zoneless-change-detection.test-context';
import { HistoryComponent } from './history.component';

const dummyTouchPointService: MockedObject<Pick<TouchPointService, 'getTouchPoints' | 'getFrameNumber' | 'getHistory' | 'getAddress' | 'isConnected'>> = {
  getTouchPoints: vi.fn().mockName('TouchPointService.getTouchPoints'),
  getHistory: vi.fn().mockName('TouchPointService.getHistory'),
  getAddress: vi.fn().mockName('TouchPointService.getAddress'),
  getFrameNumber: vi.fn().mockName('TouchPointService.getFrameNumber'),
  isConnected: vi.fn().mockName('TouchPointService.isConnected')
};

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [{ provide: TouchPointService, useValue: dummyTouchPointService }]
    });

    dummyTouchPointService.getTouchPoints.mockReturnValue(of([]));
    dummyTouchPointService.isConnected.mockReturnValue(true);
    dummyTouchPointService.getFrameNumber.mockReturnValue(of(1));
    dummyTouchPointService.getHistory.mockReturnValue(of([]));

    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('Zoneless change detection: renders history emissions even if the array reference is reused', () => {
  setupZonelessTests();

  it('renders history emissions even if the array reference is reused', async () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    await fixture.whenStable();
    const data: Array<InteractionFrame> = [{ frameId: 8123, interactions: [] }];
    history.next(data);
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '.message__id').textContent
    ).toContain('8123');
    data.push({ frameId: 8124, interactions: [] });
    history.next(data);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLInputElement).querySelectorAll('.message__id').length).toBe(
      2
    );
  });
});
