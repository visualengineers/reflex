import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { TouchPointService } from 'src/services/touch-point.service';
import { StatusComponent } from './status/status.component';
import { HistoryComponent } from './history/history.component';
import { of } from 'rxjs';
import { RouterModule } from '@angular/router';

const dummyTouchPointService: jasmine.SpyObj<TouchPointService> = jasmine.createSpyObj('TouchPointService', [
  'getTouchPoints',
  'getHistory',
  'getAddress',
  'getFrameNumber',
  'isConnected'
]
);

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterModule
      ],
      declarations: [
        AppComponent,
        StatusComponent,
        HistoryComponent
      ],
      providers: [
        { provide: TouchPointService, useValue: dummyTouchPointService }
      ]
    }).compileComponents();

    dummyTouchPointService.getTouchPoints.and.returnValue(of([]));
    dummyTouchPointService.isConnected.and.returnValue(true);
    dummyTouchPointService.getFrameNumber.and.returnValue(of(1));
    dummyTouchPointService.getHistory.and.returnValue(of([]));
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Basic Angular App'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Basic Angular App');
  });

  it('should render title in toolbar', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.toolbar__title').textContent).toContain('Basic Angular App');
  });

  it('should include status component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('app-status')).toBeTruthy();
  });

  it('should include history component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('app-history')).toBeTruthy();
  });
});
