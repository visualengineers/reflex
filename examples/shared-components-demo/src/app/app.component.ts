import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SettingsGroupComponent, ValueSliderComponent, ValueSelectionComponent, OptionCheckboxComponent, PanelHeaderComponent, ValueTextComponent } from '@reflex/angular-components/dist';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    SettingsGroupComponent,
    ValueSliderComponent,
    ValueSelectionComponent,
    OptionCheckboxComponent,
    PanelHeaderComponent,
    ValueTextComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ReFlex Shared Components Demo';
}
