import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createApplication } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { TouchPointService } from 'src/services/touch-point.service';
import type { MockedObject } from 'vitest';
import { queryElement } from '../../../../test/helpers/dom';
import { App } from './app';
import { appConfig } from './app.config';
import { HistoryComponent } from './history/history.component';
import { StatusComponent } from './status/status.component';
import {
  interaction,
  points,
  setupTests as setupZonelessTests
} from './test-utils/zoneless-change-detection.test-context';

const dummyTouchPointService: MockedObject<Pick<TouchPointService, 'getTouchPoints' | 'getFrameNumber' | 'getHistory' | 'getAddress' | 'isConnected'>> = {
  getTouchPoints: vi.fn().mockName('TouchPointService.getTouchPoints'),
  getHistory: vi.fn().mockName('TouchPointService.getHistory'),
  getAddress: vi.fn().mockName('TouchPointService.getAddress'),
  getFrameNumber: vi.fn().mockName('TouchPointService.getFrameNumber'),
  isConnected: vi.fn().mockName('TouchPointService.isConnected')
};

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule, App, StatusComponent, HistoryComponent],
      providers: [{ provide: TouchPointService, useValue: dummyTouchPointService }]
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
    const compiled = fixture.nativeElement as HTMLInputElement;
    expect(queryElement(compiled, '.toolbar__title').textContent).toContain(
      'Basic Angular App'
    );
  });

  it('should include status component', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLInputElement;
    expect(queryElement(compiled, 'app-status')).toBeTruthy();
  });

  it('should include history component', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLInputElement;
    expect(queryElement(compiled, 'app-history')).toBeTruthy();
  });
});

describe('Zoneless change detection: updates touch positions after a native window resize without another WebSocket frame', () => {
  setupZonelessTests();

  it('updates touch positions after a native window resize without another WebSocket frame', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    points.next([interaction(42, 0.5, 0.25, 1)]);
    await fixture.whenStable();
    const canvas = queryElement((fixture.nativeElement as HTMLInputElement), '.content');
    Object.defineProperty(canvas, 'offsetWidth', {
      value: 1000,
      configurable: true
    });
    Object.defineProperty(canvas, 'offsetHeight', {
      value: 800,
      configurable: true
    });
    window.dispatchEvent(new Event('resize'));
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '.touchPoint').style.transform
    ).toContain('translate(500px, 200px)');
  });
});

describe('Zoneless change detection: initializes the application without Zone.js', () => {
  setupZonelessTests();

  it('initializes the application without Zone.js', async () => {
    expect(
      Reflect.get(globalThis, 'Zone')
    ).toBeUndefined();
    const app = await createApplication(appConfig);
    try {
      expect(app.injector.get(NgZone).run(() => NgZone.isInAngularZone())).toBe(
        false
      );
    } finally {
      app.destroy();
    }
  });
});
