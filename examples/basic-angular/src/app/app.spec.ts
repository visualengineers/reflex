import type { MockedObject } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { TouchPointService } from 'src/services/touch-point.service';
import { StatusComponent } from './status/status.component';
import { HistoryComponent } from './history/history.component';
import { of } from 'rxjs';
import { RouterModule } from '@angular/router';

const dummyTouchPointService: MockedObject<Pick<TouchPointService, 'getTouchPoints' | 'getFrameNumber' | 'getHistory' | 'getAddress' | 'isConnected'>> = {
  getTouchPoints: vi.fn().mockName('TouchPointService.getTouchPoints'),
  getHistory: vi.fn().mockName('TouchPointService.getHistory'),
  getAddress: vi.fn().mockName('TouchPointService.getAddress'),
  getFrameNumber: vi.fn().mockName('TouchPointService.getFrameNumber'),
  isConnected: vi.fn().mockName('TouchPointService.isConnected'),
};

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule, App, StatusComponent, HistoryComponent],
      providers: [
        { provide: TouchPointService, useValue: dummyTouchPointService },
      ],
    }).compileComponents();

    dummyTouchPointService.getTouchPoints.mockReturnValue(of([]));
    dummyTouchPointService.isConnected.mockReturnValue(true);
    dummyTouchPointService.getFrameNumber.mockReturnValue(of(1));
    dummyTouchPointService.getHistory.mockReturnValue(of([]));
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Basic Angular App'`, () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Basic Angular App');
  });

  it('should render title in toolbar', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.toolbar__title').textContent).toContain(
      'Basic Angular App'
    );
  });

  it('should include status component', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('app-status')).toBeTruthy();
  });

  it('should include history component', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('app-history')).toBeTruthy();
  });
});
