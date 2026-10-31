import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { Interaction, InteractionFrame } from '@reflex/shared-types';
import { TouchPointService } from 'src/services/touch-point.service';
import { App } from './app';
import { appConfig } from './app.config';
import { StatusComponent } from './status/status.component';
import { HistoryComponent } from './history/history.component';

describe('Zoneless change detection', () => {
  let points: Subject<Interaction[]>;
  let frames: Subject<number>;
  let history: Subject<InteractionFrame[]>;
  let service: jasmine.SpyObj<TouchPointService>;

  beforeEach(() => {
    points = new Subject();
    frames = new Subject();
    history = new Subject();
    service = jasmine.createSpyObj('TouchPointService', ['getTouchPoints', 'getFrameNumber', 'getHistory', 'getAddress', 'isConnected']);
    service.getTouchPoints.and.returnValue(points);
    service.getFrameNumber.and.returnValue(frames);
    service.getHistory.and.returnValue(history);
    service.getAddress.and.returnValue('ws://test');
    service.isConnected.and.returnValue(false);
    TestBed.configureTestingModule({providers: [provideRouter([]), {provide: TouchPointService, useValue: service}]});
  });

  it('initializes the application without Zone.js', async () => {
    expect((globalThis as {Zone?: unknown}).Zone).toBeUndefined();
    const app = await createApplication(appConfig);
    try { expect(app.injector.get(NgZone).run(() => NgZone.isInAngularZone())).toBeFalse(); }
    finally { app.destroy(); }
  });

  it('renders WebSocket touch counts and frame numbers', async () => {
    const fixture = TestBed.createComponent(StatusComponent);
    await fixture.whenStable();
    points.next([{} as Interaction, {} as Interaction]);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('.status__stats--item')[2].textContent.trim()).toBe('2');
    frames.next(8123);
    await fixture.whenStable();
    const values = [...fixture.nativeElement.querySelectorAll('.status__stats--item')].map((e: any) => e.textContent.trim());
    expect(values).toEqual(['ws://test', '8123', '2']);
    fixture.destroy();
    expect(points.observed).toBeFalse();
    expect(frames.observed).toBeFalse();
  });

  it('renders connection polling and stops the timer when destroyed', async () => {
    const fixture = TestBed.createComponent(StatusComponent);
    await fixture.whenStable();
    const polled = new Promise<void>(resolve => service.isConnected.and.callFake(() => { resolve(); return true; }));
    await polled;
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.status__indicator').style.backgroundColor).toBe('green');
    fixture.destroy();
    service.isConnected.calls.reset();
    await new Promise(resolve => setTimeout(resolve, 550));
    expect(service.isConnected).not.toHaveBeenCalled();
  });

  it('renders history emissions even if the array reference is reused', async () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    await fixture.whenStable();
    const data: InteractionFrame[] = [{frameId: 8123, interactions: []}];
    history.next(data);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.message__id').textContent).toContain('8123');
    data.push({frameId: 8124, interactions: []});
    history.next(data);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('.message__id').length).toBe(2);
  });

  it('updates touch positions after a native window resize without another WebSocket frame', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    points.next([{touchId: 42, position: {x: 0.5, y: 0.25, z: 1}} as Interaction]);
    await fixture.whenStable();
    const canvas = fixture.nativeElement.querySelector('.content');
    Object.defineProperty(canvas, 'offsetWidth', {value: 1000, configurable: true});
    Object.defineProperty(canvas, 'offsetHeight', {value: 800, configurable: true});
    window.dispatchEvent(new Event('resize'));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.touchPoint').style.transform).toContain('translate(500px, 200px)');
  });
});
