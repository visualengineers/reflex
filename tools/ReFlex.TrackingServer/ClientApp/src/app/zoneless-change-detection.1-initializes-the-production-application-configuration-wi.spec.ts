import { NgZone } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import {
  AppVersionInfo,
  DEFAULT_SETTINGS,
  DepthCamera,
  DepthCameraState,
  TrackingConfigState,
  TrackingServerAppSettings
} from '@reflex/shared-types';
import { Subject } from 'rxjs';
import { queryElement } from '../../../../../test/helpers/dom';
import { appConfig } from './app.config';
import { HomeComponent } from './home/home.component';
import { SettingsComponent } from './settings/settings.component';
import { TrackingComponent } from './tracking/tracking.component';
import { isolateTracking, mount, settings, setupTests, text, tracking, version } from './zoneless-change-detection.test-context';
import { streaming } from './zoneless-change-detection.test-data';

describe('TrackingServer zoneless DOM updates', () => {
  setupTests();

  it('initializes the production application configuration without Zone.js', async () => {
    expect(
      Reflect.get(globalThis, 'Zone')
    ).toBeUndefined();
    const application = await createApplication(appConfig);
    try {
      expect(
        application.injector.get(NgZone).run(() => NgZone.isInAngularZone())
      ).toBe(false);
    } finally {
      application.destroy();
    }
  });

  it('renders HTTP version results through AsyncPipe', async () => {
    const response = new Subject<AppVersionInfo>();
    version.getAppVersionInfo.mockReturnValue(response);
    const fixture = await mount(HomeComponent);
    response.next({ name: 'server', version: 'zoneless-version' });
    await fixture.whenStable();
    expect(text(fixture)).toContain('zoneless-version');
  });

  it('renders a delayed camera-list HTTP response', async () => {
    isolateTracking();
    const response = new Subject<Array<DepthCamera>>();
    tracking.getCameras.mockReturnValue(response);
    const fixture = await mount(TrackingComponent);
    response.next([
      {
        id: '42',
        modelDescription: 'Async camera',
        state: DepthCameraState.Connected,
        streamParameter: {
          name: 'config',
          width: 128,
          height: 96,
          framerate: 30
        }
      }
    ]);
    await fixture.whenStable();
    expect(
      queryElement<HTMLSelectElement>((fixture.nativeElement as HTMLInputElement), '#tracking-camera-select').textContent
    ).toContain('Async camera');
  });

  it('renders SignalR camera status without another UI event', async () => {
    isolateTracking();
    const status = new Subject<TrackingConfigState>();
    tracking.getStatus.mockReturnValue(status);
    const fixture = await mount(TrackingComponent);
    status.next(streaming);
    await fixture.whenStable();
    expect(text(fixture)).toContain('Streaming');
  });

  it('updates nested settings and form controls after a settings response', async () => {
    const response = new Subject<TrackingServerAppSettings>();
    settings.getSettings.mockReturnValue(response);
    const fixture = await mount(SettingsComponent);
    const value = structuredClone(DEFAULT_SETTINGS);
    value.filterSettingValues.borderValue.left = 12;
    response.next(value);
    await fixture.whenStable();
    const input: HTMLInputElement = queryElement<HTMLInputElement>((fixture.nativeElement as HTMLInputElement), 'app-value-slider[elementid="settings-leftBorder"] input.custom-input');
    expect(input.value).toBe('12');
  });
});
