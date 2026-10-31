import {
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { BASE_URL } from 'src/shared/tokens/base-url.token';

import { PlatformLocation } from '@angular/common';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr
} from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { CustomErrorHandler } from 'src/shared/util/custom-error-handler';
import { routes } from './app.routes';

export function getBaseUrl(platformLocation: PlatformLocation): string {
  // return document.getElementsByTagName('base')[0].href;
  return platformLocation.getBaseHrefFromDOM();
}

const providers = [{ provide: BASE_URL, useFactory: getBaseUrl, deps: [PlatformLocation] }];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    providers,
    importProvidersFrom(BrowserModule, FormsModule),
    { provide: ErrorHandler, useClass: CustomErrorHandler },
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes)
  ]
};
