import { NgZone } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { setupTests as setupZonelessTests } from './test-utils/zoneless-change-detection.test-context';

describe('Zoneless change detection: initializes the production application configuration without Zone.js', () => {
  setupZonelessTests();

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
});
