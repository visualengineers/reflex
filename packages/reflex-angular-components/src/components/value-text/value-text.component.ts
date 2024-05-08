import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-value-text',
  standalone: true,
  templateUrl: './value-text.component.html',
  imports: [CommonModule, FormsModule]
})
export class ValueTextComponent {

  @Input()
  public elementTitle = '';

  @Input()
  public elementId = 'custom-select';

}
