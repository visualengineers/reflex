import { enableProdMode } from '@angular/core';
import { appConfig } from './app/app.config';
import { bootstrapApplication } from '@angular/platform-browser';
import { environment } from './environments/environment';
import { App } from './app/app';


if (environment.production) {
  enableProdMode();
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
