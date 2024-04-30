import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusComponent } from './status.component';
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

describe('StatusComponent', () => {
  let component: StatusComponent;
  let fixture: ComponentFixture<StatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StatusComponent ],
      providers: [
        { provide: TouchPointService, useValue: dummyTouchPointService }
      ]
    })
    .compileComponents();

    dummyTouchPointService.getTouchPoints.and.returnValue(of([]));
    dummyTouchPointService.isConnected.and.returnValue(true);
    dummyTouchPointService.getFrameNumber.and.returnValue(of(1));
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
