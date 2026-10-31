import type { MockedObject } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoryComponent } from './history.component';
import { TouchPointService } from 'src/services/touch-point.service';
import { of } from 'rxjs';

const dummyTouchPointService: MockedObject<Pick<TouchPointService, 'getTouchPoints' | 'getFrameNumber' | 'getHistory' | 'getAddress' | 'isConnected'>> = {
  getTouchPoints: vi.fn().mockName('TouchPointService.getTouchPoints'),
  getHistory: vi.fn().mockName('TouchPointService.getHistory'),
  getAddress: vi.fn().mockName('TouchPointService.getAddress'),
  getFrameNumber: vi.fn().mockName('TouchPointService.getFrameNumber'),
  isConnected: vi.fn().mockName('TouchPointService.isConnected'),
};

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        { provide: TouchPointService, useValue: dummyTouchPointService },
      ],
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
