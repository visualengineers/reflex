import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ValueSelectionComponent } from './value-selection.component';

@Component({
  selector: 'app-value-selection',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '',
})
export class MockValueSelectionComponent
  implements Partial<ValueSelectionComponent>
{
  @Input()
  public elementTitle = '';

  @Input()
  public elementId = 'custom-select';
}
