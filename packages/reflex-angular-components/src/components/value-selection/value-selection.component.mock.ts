import { Component, Input } from '@angular/core';
import { ValueSelectionComponent } from './value-selection.component';

@Component({
    selector: 'app-value-selection', template: '',
    standalone: false
})
export class MockValueSelectionComponent implements Partial<ValueSelectionComponent> {

  @Input()
  public elementTitle = '';

  @Input()
  public elementId = 'custom-select';
}