import { ApplicationConfig, ErrorHandler, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CustomErrorHandler } from 'src/shared/util/custom-error-handler';
import { PlatformLocation } from '@angular/common';

export function getBaseUrl(platformLocation: PlatformLocation): string {
  // return document.getElementsByTagName('base')[0].href;
  return platformLocation.getBaseHrefFromDOM();
}

const providers = [{ provide: 'BASE_URL', useFactory: getBaseUrl, deps: [PlatformLocation] }];

export const appConfig: ApplicationConfig = {
  providers: [
    providers,
    importProvidersFrom(
      BrowserModule,
      FormsModule
    ),
    { provide: ErrorHandler, useClass: CustomErrorHandler },
    provideHttpClient(withInterceptorsFromDi()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay())
  ]
};
