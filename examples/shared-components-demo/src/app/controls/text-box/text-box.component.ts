import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsGroupComponent, ValueTextComponent } from '@reflex/angular-components/dist';

@Component({
  selector: 'app-text-box',
  standalone: true,
  imports: [ CommonModule, FormsModule, SettingsGroupComponent, ValueTextComponent ],
  templateUrl: './text-box.component.html',
  styleUrl: './text-box.component.scss'
})
export class TextBoxComponent {
  public numChanges = 0;

  public address = 'http://www.test-adresse.com/api';

  public updateAddress() {
    this.numChanges++;
  }
}
