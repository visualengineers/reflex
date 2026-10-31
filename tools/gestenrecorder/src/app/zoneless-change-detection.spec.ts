import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject, NEVER } from 'rxjs';
import { appConfig } from './app.config';
import { Gesture } from './data/gesture';
import { GestureTrackFrame } from './data/gesture-track-frame';
import { ConfigurationService } from './service/configuration.service';
import { ConnectionService } from './service/connection.service';
import { GestureDataService } from './service/gesture-data.service';
import { GestureReplayService } from './service/gesture-replay.service';
import { RecorderoptionsComponent } from './recorderoptions/recorderoptions.component';
import { GestureoptionsComponent } from './gestureoptions/gestureoptions.component';
import { SavingoptionsComponent } from './savingoptions/savingoptions.component';
import { TrackComponentComponent } from './track-component/track-component.component';
import { DropdownComponent } from './dropdown/dropdown.component';
import { TimelineComponent } from './timeline/timeline.component';
import { TouchAreaComponent } from './touch-area/touch-area.component';
import { TouchAreaService } from './touch-area/service/touch-area.service';

describe('Zoneless change detection', () => {
  let gestures: Subject<Gesture>;
  let points: Subject<GestureTrackFrame[]>;
  let fileNames: Subject<string[]>;

  beforeEach(() => {
    gestures = new Subject();
    points = new Subject();
    fileNames = new Subject();
    TestBed.configureTestingModule({providers: [
      provideHttpClient(), provideHttpClientTesting(),
      {provide: GestureDataService, useValue: {
        gesture$: gestures, gesturePoints$: points,
        getGestureFileNames: () => fileNames,
        addGestureTrackFrame: jasmine.createSpy(), getGestureTrackFrames: () => [],
        getGestureNumFrames: 3
      }},
      {provide: GestureReplayService, useValue: {playbackFrame$: NEVER}},
      {provide: ConnectionService, useValue: {disconnect: jasmine.createSpy(), sendMessage: jasmine.createSpy()}}
    ]});
  });

  it('initializes the application without Zone.js', async () => {
    expect((globalThis as {Zone?: unknown}).Zone).toBeUndefined();
    const app = await createApplication(appConfig);
    try { expect(app.injector.get(NgZone).run(() => NgZone.isInAngularZone())).toBeFalse(); }
    finally { app.destroy(); }
  });

  it('closes an opened dropdown through the document HostListener', async () => {
    const fixture = TestBed.createComponent(DropdownComponent);
    await fixture.whenStable();
    fixture.nativeElement.querySelector('.dropdown_button').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-savingoptions')).not.toBeNull();
    document.body.click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-savingoptions')).toBeNull();
  });

  it('renders touch-count changes received by the recorder options', async () => {
    const fixture = TestBed.createComponent(RecorderoptionsComponent);
    await fixture.whenStable();
    TestBed.inject(ConfigurationService).setAmoutTouchPoints(17);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#max-amountTouchPoints').value).toBe('17');
  });

  it('renders layer changes received by the gesture options', async () => {
    const fixture = TestBed.createComponent(GestureoptionsComponent);
    await fixture.whenStable();
    TestBed.inject(ConfigurationService).setLayers({up: 12, down: 7, colorUp: '#123456', colorDown: '#654321'});
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#layersUp').value).toBe('12');
  });

  it('renders asynchronously loaded gesture file names', async () => {
    const fixture = TestBed.createComponent(SavingoptionsComponent);
    await fixture.whenStable();
    fileNames.next(['new-gesture.json', 'another-gesture.json']);
    await fixture.whenStable();
    const options = fixture.nativeElement.querySelectorAll('#gestureFileNames option');
    expect(options.length).toBe(2);
    expect(options[0].textContent).toContain('new-gesture.json');
    fixture.destroy();
    expect(fileNames.observed).toBeFalse();
  });

  it('renders a newly loaded gesture in the editable track table', async () => {
    const fixture = TestBed.createComponent(TrackComponentComponent);
    await fixture.whenStable();
    gestures.next({id: 42, name: 'Loaded gesture', numFrames: 71, speed: 2, tracks: []});
    await fixture.whenStable();
    const inputs = fixture.nativeElement.querySelectorAll('tbody input');
    expect([...inputs].map((e: any) => e.value)).toEqual(['42', 'Loaded gesture', '71', '2']);
    fixture.destroy();
    expect(gestures.observed).toBeFalse();
  });

  it('passes asynchronous gesture and point updates to the actual Plotly view', async () => {
    const fixture = TestBed.createComponent(TimelineComponent);
    await fixture.whenStable();
    gestures.next({id: 42, name: 'Loaded gesture', numFrames: 3, speed: 1, tracks: []});
    points.next([{x: 1, y: 2, z: 0.5}, {x: 2, y: 3, z: -0.5}]);
    await fixture.whenStable();
    // Plotly finishes its own asynchronous drawing after Angular updates its inputs.
    for (let attempt = 0; attempt < 40 && fixture.nativeElement.querySelectorAll('.scatterlayer .point').length !== 2; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    expect(fixture.nativeElement.querySelectorAll('.scatterlayer .point').length).toBe(2);
    fixture.destroy();
    expect(gestures.observed).toBeFalse();
    expect(points.observed).toBeFalse();
  });

  it('updates the touch-area background after a service emission', async () => {
    const fixture = TestBed.createComponent(TouchAreaComponent);
    await fixture.whenStable();
    TestBed.inject(ConfigurationService).setBackgroundImage('assets/new-background.png');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('canvas').style.backgroundImage).toContain('assets/new-background.png');
  });

  it('updates hover-menu inputs and visibility after native canvas events', async () => {
    const area = TestBed.inject(TouchAreaService);
    const hovered = spyOn(area, 'getHoveredCircles').and.returnValue([0]);
    const fixture = TestBed.createComponent(TouchAreaComponent);
    await fixture.whenStable();
    const config = TestBed.inject(ConfigurationService);
    config.setNormalizedPoints([{index: 0, x: 0.25, y: 0.5, z: 1, time: 0}]);
    const canvas: HTMLCanvasElement = fixture.nativeElement.querySelector('canvas');
    canvas.dispatchEvent(new MouseEvent('mousemove', {clientX: 10, clientY: 20}));
    await fixture.whenStable();
    const x: HTMLInputElement = fixture.nativeElement.querySelector('input[id="hoveredPoint.x"]');
    expect(x.value).toBe('0.25');
    canvas.dispatchEvent(new MouseEvent('mousedown', {button: 1}));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-hover-menu button').textContent).toContain('Lösen');
    canvas.dispatchEvent(new MouseEvent('mousedown', {button: 1}));
    await fixture.whenStable();
    hovered.and.returnValue([]);
    canvas.dispatchEvent(new MouseEvent('mousemove'));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.hover-menu')).toBeNull();
  });
});
