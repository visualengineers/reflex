import { Component, Input } from '@angular/core';
import { SettingsGroupComponent } from './settings-group.component';

@Component({
    selector: 'app-settings-group', template: ''
})
export class MockSettingsGroupComponent implements Partial<SettingsGroupComponent> {

  @Input()
  public toggleId = 'custom';

  @Input()
  public elementTitle = 'Custom Title';

}
