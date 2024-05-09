import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsGroupComponent } from '@reflex/angular-components/dist';

@Component({
  selector: 'app-buttons',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SettingsGroupComponent
  ],
  templateUrl: './buttons.component.html',
  styleUrl: './buttons.component.scss'
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ButtonsComponent {
}
