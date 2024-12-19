import { enableProdMode, importProvidersFrom } from '@angular/core';


import { environment } from './environments/environment';
import { GestureReplayService } from './app/service/gesture-replay.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppRoutingModule } from './app/app-routing.module';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app/app.component';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(AppRoutingModule, BrowserModule, FontAwesomeModule, FormsModule),
        GestureReplayService,
        provideHttpClient(withInterceptorsFromDi())
    ]
})
  .catch(err => console.error(err));
