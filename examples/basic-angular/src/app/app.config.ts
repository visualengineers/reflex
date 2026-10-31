import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';

const providers = [
  { provide: 'WEBSOCKET_URL', useValue: environment.websocketUrl, deps: [] },
];

export const appConfig: ApplicationConfig = {
  providers: [
    providers,
    provideZoneChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay())
  ]
};
