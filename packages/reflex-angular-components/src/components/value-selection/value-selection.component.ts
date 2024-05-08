import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-value-selection',
  standalone: true,
  templateUrl: './value-selection.component.html',
  imports: [CommonModule, FormsModule]
})
export class ValueSelectionComponent {

  @Input()
  public elementTitle = '';

  @Input()
  public elementId = 'custom-select';

}
