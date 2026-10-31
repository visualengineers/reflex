import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-value-selection',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './value-selection.component.html'
})
export class ValueSelectionComponent {
  @Input()
  public elementTitle = '';

  @Input()
  public elementId = 'custom-select';
}
