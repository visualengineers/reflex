import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-option-checkbox',
  standalone: true,
  templateUrl: './option-checkbox.component.html',
  imports: [CommonModule, FormsModule]
})
export class OptionCheckboxComponent {

  @Input()
  public data = false;

  @Output()
  public dataChange = new EventEmitter<boolean>();

  @Input()
  public elementId = 'custom-checkbox';

  @Input()
  public elementTitle = 'Custom Value';

  @Output()
  public onChange = new EventEmitter();

  public onModelChange(): void {
    this.dataChange.emit(this.data);
    this.onChange.emit();
  }
}
