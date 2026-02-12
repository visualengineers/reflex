import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-value-selection',
  standalone: true,
  templateUrl: './value-selection.component.html'
})
export class ValueSelectionComponent {

  @Input()
  public elementTitle = '';

  @Input()
  public elementId = 'custom-select';

}
