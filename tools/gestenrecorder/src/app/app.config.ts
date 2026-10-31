import {
  ApplicationConfig,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  provideClientHydration,
  withNoIncrementalHydration
} from '@angular/platform-browser';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withNoIncrementalHydration()),
    provideHttpClient(withXhr())
  ]
};
