import { BASE_URL } from 'src/shared/tokens/base-url.token';
import {
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { BrowserModule } from '@angular/platform-browser';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CustomErrorHandler } from 'src/shared/util/custom-error-handler';
import { PlatformLocation } from '@angular/common';

export function getBaseUrl(platformLocation: PlatformLocation): string {
  // return document.getElementsByTagName('base')[0].href;
  return platformLocation.getBaseHrefFromDOM();
}

const providers = [
  { provide: BASE_URL, useFactory: getBaseUrl, deps: [PlatformLocation] },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    providers,
    importProvidersFrom(BrowserModule, FormsModule),
    { provide: ErrorHandler, useClass: CustomErrorHandler },
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
  ],
};
