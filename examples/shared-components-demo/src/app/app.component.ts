import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OptionCheckboxComponent, PanelHeaderComponent, SettingsGroupComponent, ValueSliderComponent, ValueTextComponent } from '@reflex/angular-components/dist/@reflex/angular-components'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    SettingsGroupComponent,
    ValueSliderComponent,
    ValueSliderComponent,
    OptionCheckboxComponent,
    PanelHeaderComponent,
    ValueTextComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ReFlex | Shared Components Demo';
}
