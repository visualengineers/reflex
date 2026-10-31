import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-value-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './value-text.component.html',
})
export class ValueTextComponent {
  @Input()
  public elementTitle = '';

  @Input()
  public elementId = 'custom-select';
}
