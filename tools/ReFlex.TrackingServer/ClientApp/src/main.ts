import { enableProdMode, ErrorHandler, importProvidersFrom } from '@angular/core';
import { environment } from './environments/environment';
import { CustomErrorHandler } from 'src/shared/util/custom-error-handler';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app/app-routing.module';
import { SettingsGroupComponent, ValueSliderComponent, ValueSelectionComponent, OptionCheckboxComponent, PanelHeaderComponent, ValueTextComponent } from '@reflex/angular-components/dist';
import { AppComponent } from './app/app.component';

export function getBaseUrl(): string {
  return document.getElementsByTagName('base')[0].href;
}

const providers = [{ provide: 'BASE_URL', useFactory: getBaseUrl, deps: [] }];

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    providers,
    importProvidersFrom(
      BrowserModule,
      FormsModule,
      AppRoutingModule,
      SettingsGroupComponent,
      ValueSliderComponent,
      ValueSelectionComponent,
      OptionCheckboxComponent,
      PanelHeaderComponent,
      ValueTextComponent
    ),
    { provide: ErrorHandler, useClass: CustomErrorHandler },
    provideHttpClient(withInterceptorsFromDi())
  ]
})
  .catch((err) => console.log(err));
