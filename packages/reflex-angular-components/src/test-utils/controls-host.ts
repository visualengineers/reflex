import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OptionCheckboxComponent } from '../components/option-checkbox/option-checkbox.component';
import { PanelHeaderComponent } from '../components/panel-header/panel-header.component';
import { ValueSliderComponent } from '../components/value-slider/value-slider.component';

@Component({
  imports: [
    ValueSliderComponent,
    OptionCheckboxComponent,
    PanelHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-value-slider [(data)]="value" (onChange)="saved = value" />
    <app-option-checkbox [(data)]="checked" />
    <app-panel-header [(data)]="active" />
    <p id="result">{{ value }} / {{ saved }} / {{ checked }} / {{ active }}</p>
  `
})
export class ControlsHost {
  public value = 0;
  public saved = 0;
  public checked = false;
  public active = true;
}
