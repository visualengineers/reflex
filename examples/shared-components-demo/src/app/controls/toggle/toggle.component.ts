import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  OptionCheckboxComponent,
  SettingsGroupComponent,
} from '@reflex/angular-components/dist';

@Component({
  selector: 'app-toggle',
  imports: [FormsModule, OptionCheckboxComponent, SettingsGroupComponent],
  templateUrl: './toggle.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './toggle.component.scss',
})
export class ToggleComponent {
  public toggleBordersActive = true;
  public bordersActive = false;
}
