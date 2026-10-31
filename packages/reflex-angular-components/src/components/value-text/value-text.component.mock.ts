import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ValueTextComponent } from './value-text.component';

@Component({
  selector: 'app-value-text',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: ''
})
export class MockValueTextComponent implements Partial<ValueTextComponent> {
  @Input()
  public elementTitle = '';

  @Input()
  public elementId = 'custom-select';
}
