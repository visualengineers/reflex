import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SettingsComponent } from './settings.component';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '',
})
export class MockSettingsComponent implements Partial<SettingsComponent> {}
