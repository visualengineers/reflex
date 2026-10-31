import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createApplication } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { appConfig } from './app.config';
import { ConfigurationService } from './service/configuration.service';
import { ConnectionService } from './service/connection.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { CanvasComponent } from './canvas/canvas.component';

describe('Zoneless change detection', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ConnectionService,
          useValue: {
            init: vi.fn(),
            destroy: vi.fn(),
            disconnect: vi.fn(),
            sendMessage: vi.fn(),
            connectionSuccessful: new Subject<boolean>(),
          },
        },
      ],
    });
  });

  it('initializes the application without Zone.js', async () => {
    expect(
      (
        globalThis as {
          Zone?: unknown;
        }
      ).Zone
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

  it('renders asynchronous touch-count and backup timestamp changes', async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const config = TestBed.inject(ConfigurationService);
    await fixture.whenStable();
    config.setAmountTouchPoints(17);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('#amountTouchPoints').value
    ).toBe('17');
    config.backupTimestamp$.next(new Date('2030-04-05T12:00:00Z'));
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('2030');
    fixture.destroy();
    expect(config.backupTimestamp$.observed).toBe(false);
    expect(config.backupTimestamp$.closed).toBe(false);
  });

  it('renders new layer objects and in-place layer mutations', async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const config = TestBed.inject(ConfigurationService);
    await fixture.whenStable();
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    click.preventDefault(); // Exercise the Angular handler without navigating Karma's iframe.
    fixture.nativeElement.querySelectorAll('.nav-link')[1].dispatchEvent(click);
    await fixture.whenStable();
    const layers = {
      up: 12,
      down: 7,
      colorUp: '#123456',
      colorDown: '#654321',
    };
    config.setLayers(layers);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#layersUp').value).toBe('12');
    layers.up = 13;
    config.setLayers(layers);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#layersUp').value).toBe('13');
  });

  it('keeps the native WebSocket connection indicator working', async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    await fixture.whenStable();
    const state = TestBed.inject(ConnectionService)
      .connectionSuccessful as Subject<boolean>;
    state.next(true);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('.connection-indicator').classList
    ).toContain('success');
    state.next(false);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('.connection-indicator').classList
    ).toContain('error');
  });

  it('updates the canvas background binding after a service emission', async () => {
    const fixture = TestBed.createComponent(CanvasComponent);
    const config = TestBed.inject(ConfigurationService);
    await fixture.whenStable();
    config.setBackgroundImage('assets/new-background.png');
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('canvas').style.backgroundImage
    ).toContain('assets/new-background.png');
    fixture.destroy();
    expect(config.background$.observed).toBe(false);
    expect(config.background$.closed).toBe(false);
    expect(config.amountTouchPoints$.closed).toBe(false);
  });
});
