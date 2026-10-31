import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-settings-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './settings-group.component.html',
})
export class SettingsGroupComponent {
  @Input()
  public toggleId = 'custom';

  @Input()
  public elementTitle = 'Custom Title';
}
