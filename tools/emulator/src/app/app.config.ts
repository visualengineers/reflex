import {
  ApplicationConfig,
  importProvidersFrom,
  provideZonelessChangeDetection
} from '@angular/core';

import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr
} from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AppRoutingModule } from './app-routing.module';
import { GestureReplayService } from './service/gesture-replay.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    importProvidersFrom(
      AppRoutingModule,
      BrowserModule,
      FontAwesomeModule,
      FormsModule
    ),
    GestureReplayService,
    provideHttpClient(withXhr(), withInterceptorsFromDi())
  ]
};
