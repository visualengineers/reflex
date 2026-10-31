import {
  ApplicationConfig,
  importProvidersFrom,
  provideZonelessChangeDetection,
} from '@angular/core';

import { GestureReplayService } from './service/gesture-replay.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';

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
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
  ],
};
