import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoryComponent } from './history.component';
import { TouchPointService } from 'src/services/touch-point.service';
import { of } from 'rxjs';

const dummyTouchPointService: jasmine.SpyObj<TouchPointService> = jasmine.createSpyObj('TouchPointService', [
  'getTouchPoints',
  'getHistory',
  'getAddress',
  'getFrameNumber',
  'isConnected'
]
);

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HistoryComponent],
      providers: [
        { provide: TouchPointService, useValue: dummyTouchPointService }
      ]
    });

    dummyTouchPointService.getTouchPoints.and.returnValue(of([]));
    dummyTouchPointService.isConnected.and.returnValue(true);
    dummyTouchPointService.getFrameNumber.and.returnValue(of(1));
    dummyTouchPointService.getHistory.and.returnValue(of([]));

    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
