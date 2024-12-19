import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OptionCheckboxComponent, SettingsGroupComponent } from '@reflex/angular-components/dist';

@Component({
    selector: 'app-toggle',
    imports: [
        CommonModule,
        FormsModule,
        OptionCheckboxComponent,
        SettingsGroupComponent
    ],
    templateUrl: './toggle.component.html',
    styleUrl: './toggle.component.scss'
})
export class ToggleComponent {

  public toggleBordersActive = true;
  public bordersActive = false;
}
