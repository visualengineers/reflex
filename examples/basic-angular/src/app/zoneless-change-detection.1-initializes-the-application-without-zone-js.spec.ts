import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createApplication } from '@angular/platform-browser';
import { InteractionFrame } from '@reflex/shared-types';
import { queryElement } from '../../../../test/helpers/dom';
import { appConfig } from './app.config';
import { HistoryComponent } from './history/history.component';
import { StatusComponent } from './status/status.component';
import { frames, history, interaction, points, service, setupTests } from './zoneless-change-detection.test-context';

describe('Zoneless change detection', () => {
  setupTests();

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

  it('renders WebSocket touch counts and frame numbers', async () => {
    const fixture = TestBed.createComponent(StatusComponent);
    await fixture.whenStable();
    points.next([interaction(1), interaction(2)]);
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLInputElement)
        .querySelectorAll('.status__stats--item')[2]
        .textContent?.trim()
    ).toBe('2');
    frames.next(8123);
    await fixture.whenStable();
    const values = [...(fixture.nativeElement as HTMLInputElement).querySelectorAll('.status__stats--item')].map((e) => e.textContent?.trim());
    expect(values).toEqual(['ws://test', '8123', '2']);
    fixture.destroy();
    expect(points.observed).toBe(false);
    expect(frames.observed).toBe(false);
  });

  it('renders connection polling and stops the timer when destroyed', async () => {
    const fixture = TestBed.createComponent(StatusComponent);
    await fixture.whenStable();
    const polled = new Promise<void>((resolve) =>
      service.isConnected.mockImplementation(() => {
        resolve();

        return true;
      }));
    await polled;
    await fixture.whenStable();
    expect(
      queryElement((fixture.nativeElement as HTMLInputElement), '.status__indicator').style
        .backgroundColor
    ).toBe('green');
    fixture.destroy();
    service.isConnected.mockClear();
    await new Promise((resolve) => setTimeout(resolve, 550));
    expect(service.isConnected).not.toHaveBeenCalled();
  });

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
