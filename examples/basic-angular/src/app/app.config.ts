import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { WEBSOCKET_URL } from '../services/touch-point.service';

import {
  provideClientHydration,
  withEventReplay,
  withNoIncrementalHydration
} from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { routes } from './app.routes';

const providers = [{ provide: WEBSOCKET_URL, useValue: environment.websocketUrl, deps: [] }];

export const appConfig: ApplicationConfig = {
  providers: [
    providers,
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay(), withNoIncrementalHydration())
  ]
};
