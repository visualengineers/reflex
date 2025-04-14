import { Component, Input } from '@angular/core';
import { ValueTextComponent } from './value-text.component';

@Component({
    selector: 'app-value-text', template: ''
})
export class MockValueTextComponent implements Partial<ValueTextComponent> {

  @Input()
  public elementTitle = '';

  @Input()
  public elementId = 'custom-select';

}
