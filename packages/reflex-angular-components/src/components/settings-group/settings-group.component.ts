import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings-group',
  standalone: true,
  templateUrl: './settings-group.component.html',
  imports: [CommonModule, FormsModule]
})
export class SettingsGroupComponent {

  @Input()
  public toggleId = 'custom';

  @Input()
  public elementTitle = 'Custom Title';

}
